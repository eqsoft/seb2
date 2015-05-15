window.onload = init;

var 	prot 		= "",
	sock_url 	= "", 
	msg		= null,
	ws		= null,
	sebTable	= null,
	sebTableHead 	= null,
	sebTableBody 	= null,
	ws		= null,
	params		= {},
	ipFilter	= {},
	checkIp		= null,
	handler		= 	{ 
					"addData":addData,
					"addSeb":addSeb, 
					"removeSeb":removeSeb 
				};
				

function init() {
	msg = document.getElementById("message");
	log("init");
	params = getParams();
	ipFilter["local"] = /^(127\.0\.0\.1$)|(\:\:1)$/;
	ipFilter["intern"] = /^192\.168\.0\.\d+$/;
	defaultFilter = (defaultFilter) ? defaultFilter : (params.filter) ? params.filter : null;
	log("defaultFilter: " + defaultFilter);
	if (defaultFilter && ipFilter[defaultFilter]) { //can be defined in html page	
		checkIp = ipFilter[defaultFilter];
	}
	if (params.filter && ipFilter[params.filter]) {
		defaultFilter = params.filter;
		checkIp = ipFilter[defaultFilter];
	}
	if (checkIp != null) {
		var val = btnShutDownAll.getAttribute("value") + ": " + defaultFilter;
		btnShutDownAll.setAttribute("value", val);
	}
	//log("regex: "+ipFilter["local"].test("127.0.0.0"));
	sebTable = document.getElementById("sebTable");
	sebTableHead = document.getElementById("sebTableHead");
	sebTableBody = document.getElementById("sebTableBody");
	prot = (window.location.protocol === "https:") ? "wss:" : "ws:"; // for ssl
	sock_url = prot + "//" + window.location.host; 
	ws = new WebSocket(sock_url);
	ws.onopen = on_open;
	ws.onclose = on_close;
	ws.onmessage = on_message;
	ws.onerror = on_error;
}

function on_open() {
	log("on_open");
}

function on_close() {
	log("on_close");
}

function on_message(e) {
	//log("on_message: " + e.data);
	var obj = JSON.parse(e.data);
	var h = handler[obj.handler];
	if (typeof h === 'function') {
		h.apply(undefined, [obj.opts]);
	} 
}

function on_error(e) {
	log("on_error: " + e);
}

function log(str) {
	console.log(str);
	if (msg.textContent) {
		msg.textContent = str;
		return;
	}
	if (msg.innerText) {
		msg.innerText = str;	
		return;
	}
	msg.innerHTML = str;
}

/* handler */

function addData(sebs) { // pushed from monitor server
	log("addData: " + JSON.stringify(sebs));
	for (var key in sebs) {
		addRow(sebs[key]);
	}
}

function addSeb(seb) {
	log("addSeb: " + JSON.stringify(seb));
	addRow(seb);
}

function removeSeb(seb) {
	log("removeSeb: " + JSON.stringify(seb));
	removeRow(seb);
}

function getParams() {
    if (!window.location.search) {
        return({});   // return empty object
    }
    var parms = {};
    var temp;
    var items = window.location.search.slice(1).split("&");   // remove leading ? and split
    for (var i = 0; i < items.length; i++) {
        temp = items[i].split("=");
        if (temp[0]) {
            if (temp.length < 2) {
                temp.push("");
            }
            parms[decodeURIComponent(temp[0])] = decodeURIComponent(temp[1]);        
        }
    }
    return(parms);
}

/* GUI */
function resetTable() {
}

function setFilter() {
}

function addRow(seb) {
	log("addRow: " + JSON.stringify(seb));
	if (checkIp != null && !checkIp.test(seb.ip)) {
		log("filtered: " + seb.ip); 
		return; 
	};
	
	var row = sebTableBody.insertRow(0);
	row.setAttribute("id","row_"+seb.id);
	var idCell = row.insertCell(0);
	idCell.className = "td-id";
	var ipCell = row.insertCell(1);
	ipCell.className = "td-ip";
	var sdCell = row.insertCell(2);
	sdCell.className = "td-shutdown";
	
	idCell.innerHTML = seb.id;
	ipCell.innerHTML = seb.ip;
	sdCell.innerHTML = "<input type=\"button\" value=\"shutdown\" class=\"btn-shutdown\" onclick=\"shutdown(\'" + seb.id + "\');\" />";
}

function removeRow(seb) {
	log("removeRow: " + JSON.stringify(seb));
	var row = document.getElementById("row_"+seb.id);
	if (row) {
		row.parentNode.removeChild(row);
	}
}

function shutdown(id) {
	log("shutdown: " + id);
	var ret = confirm("Shutdown " + id + "?");
	if (ret) {
		ws.send(JSON.stringify({"handler":"shutdown","opts":{"id":id}}));
	}
}

function shutdownAll() {
	log("shutdownAll");
	//var ids = document.querySelector('.td-id');
	//log(JSON.stringify(ids));
	//var rows sebTableBody.getElementBy
}

//http://caniuse.com/#feat=queryselector
