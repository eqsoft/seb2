window.onload = init;

var prot 		= "",
	sock_url 	= "", 
	ws		= null,
	sebTable	= null,
	sebTableHead 	= null,
	sebTableBody 	= null,
	totalCount	= null,
	ws		= null,
	params		= {},
	ipFilter	= [],
	hideFilter	= [],
	checkIp		= null,
	divContent	= null,	
	monitorTitle	= null,
	selRooms 	= null,
	defaultFilter	= 'select',
	handler		= 	{ 
					"addData":addData,
					"addSeb":addSeb, 
					"removeSeb":removeSeb,
					"lockedSeb":lockedSeb,
					"unlockedSeb":unlockedSeb,
					"pwdShownSeb":pwdShownSeb,
					"pwdHiddenSeb":pwdHiddenSeb,
					"socketError":socketError
				};
				
function init() {
	log("init");
	params = {};
	var href = window.location.href.split('?')[0];

	params = getParams();

	if (params.filter) {
		if (!ipFilter[params.filter] && params.filter != 'select') {
			log("wrong filter: " + params.filter);
			defaultFilter = 'select';
		}
		else {
			defaultFilter = params.filter;
		}
	}	
	monitorTitle = document.getElementById("monitorTitle");
	divContent = document.getElementById("divContent");
	selRooms = document.getElementById("selRooms");
	Object.keys(ipFilter).sort().map(k => {
		if (hideFilter.indexOf(k) == -1) {
			let optRoom = document.createElement("option");
			optRoom.text = k;
			if (k == defaultFilter) {
				optRoom.setAttribute("selected","selected");
			}
			selRooms.add(optRoom);
		}
	});
	selRooms.addEventListener("change", function(evt) {
        	defaultFilter = evt.target[evt.target.selectedIndex].value;
		window.location.href = href + '?filter='+defaultFilter;
	});
		
	var btnShutDownAll = document.getElementById('btnShutDownAll');
	var btnRebootAll = document.getElementById('btnRebootAll');
	if (defaultFilter !== 'select') {
		checkIp = ipFilter[defaultFilter].regex;
	}
	
	if (checkIp != null) {
		var val = btnShutDownAll.getAttribute("value") + ": " + defaultFilter;
		btnShutDownAll.setAttribute("value", val);
		val = btnRebootAll.getAttribute("value") + ": " + defaultFilter;
		btnRebootAll.setAttribute("value", val);
	}
	
	sebTable = document.getElementById("sebTable");
	sebTableHead = document.getElementById("sebTableHead");
	sebTableBody = document.getElementById("sebTableBody");
	totalCount = document.getElementById("totalCount");
	
	prot = (window.location.protocol === "https:") ? "wss:" : "ws:"; // for ssl
	sock_url = prot + "//" + window.location.host;
	ws = new WebSocket(sock_url);
	ws.onopen = on_open;
	ws.onclose = on_close;
	ws.onmessage = on_message;
	ws.onerror = on_error;
	if (defaultFilter !== 'select') {
		monitorTitle.innerHTML = ipFilter[defaultFilter].title;
		divContent.style.visibility = 'visible';		
	}
	else {
		monitorTitle.innerHTML = 'Welcome to seb Monitor';
		divContent.style.visibility = 'hidden';
	}
}

function on_open() {
	log("on_open");
}

function on_close() {
	log("on_close");
}

function on_message(e) {
	log("on_message: " + e.data);
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

function lockedSeb(obj) {
	log("lockedSeb: " + obj.seb.id);
	var el = document.getElementById("lockstatus_" + obj.seb.id);
	el.setAttribute("src","images/locked.png");
} 

function unlockedSeb(obj) { 
        log("unlockedSeb: " + obj.seb.id);
	var el = document.getElementById("lockstatus_" + obj.seb.id);
        el.setAttribute("src","images/unlocked.png");
}


function pwdShownSeb(obj) {
        log("pwdShown: " + obj.seb.id);
        var el = document.getElementById("pwdstatus_" + obj.seb.id);
        el.setAttribute("src","images/pwd_shown.svg");
}

function pwdHiddenSeb (obj) {
        log("pwdHidden: " + obj.seb.id);
        var el = document.getElementById("pwdstatus_" + obj.seb.id);
        el.setAttribute("src","images/pwd_hidden.svg");
}

function socketError(opts) {
	log(opts.error);
	ws.close();
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
	row.setAttribute("id",seb.id);

	var ipCell = row.insertCell(0);
	ipCell.className = "td-ip";
	
	var rbCell = row.insertCell(1);
	rbCell.className = "td-reboot";

	var sdCell = row.insertCell(2);
        sdCell.className = "td-shutdown";

	var rtCell = row.insertCell(3);
        rtCell.className = "td-runtest";
	
	var pwdCell = row.insertCell(4);
        pwdCell.className = "td-pwd";	

	var lckCell = row.insertCell(5);
	lckCell.className = "td-lock";

	var lock_status = (seb.locked) ? "locked" : "unlocked";
	var pwd_status = (seb.pwdShown) ? "pwd_shown" : "pwd_hidden";
	
	ipCell.innerHTML = seb.ip;
	rbCell.innerHTML = "<input type=\"button\" value=\"reboot\" class=\"btn-reboot\" onclick=\"reboot(\'" + seb.id + "\');\" />";
	sdCell.innerHTML = "<input type=\"button\" value=\"shutdown\" class=\"btn-shutdown\" onclick=\"shutdown(\'" + seb.id + "\');\" />";
	rtCell.innerHTML = "<input type=\"button\" value=\"runtest\" class=\"btn-runtest\" onclick=\"runTest(\'" + seb.id + "\');\" />";
	pwdCell.innerHTML = "<input type=\"image\" class=\"btn-pwd\" title=\"password\" id=\"pwdstatus_" +  seb.id + "\" src=\"images/" + pwd_status + ".svg\" onclick=\"togglePassword(\'" + seb.id + "\');\" />";
	lckCell.innerHTML = "<input type=\"image\" class=\"btn-lock\" title=\"lock\" id=\"lockstatus_" +  seb.id + "\" src=\"images/" + lock_status + ".png\" onclick=\"toggleLock(\'" + seb.id + "\');\" />";

	totalCount.innerHTML = sebTableBody.getElementsByTagName("tr").length;
}

function removeRow(seb) {
	log("removeRow: " + JSON.stringify(seb));
	var row = document.getElementById(seb.id);
	if (row) {
		row.parentNode.removeChild(row);
		totalCount.innerHTML = sebTableBody.getElementsByTagName("tr").length;
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
	var idNodes = sebTableBody.querySelectorAll('tr');
	var ids = [];
	for (var i=0;i<idNodes.length;i++) {
		ids.push(idNodes[i].id);
	}
	var ret = confirm("Shutdown all " + defaultFilter + "?");
	if (ret) {
		ws.send(JSON.stringify({"handler":"shutdownAll","opts":{"ids":ids}}));
	}
}

function reboot(id) {
        log("reboot: " + id);
        var ret = confirm("Reboot " + id + "?");
        if (ret) {
                ws.send(JSON.stringify({"handler":"reboot","opts":{"id":id}}));
        }
}

function rebootAll() {
        log("rebootAll");
        var idNodes = sebTableBody.querySelectorAll('tr');
        var ids = [];
        for (var i=0;i<idNodes.length;i++) {
                ids.push(idNodes[i].id);
        }
        var ret = confirm("Reboot all " + defaultFilter + "?");
        if (ret) {
                ws.send(JSON.stringify({"handler":"rebootAll","opts":{"ids":ids}}));
        }
        //var rows sebTableBody.getElementBy
}

function lock(id) {
        log("lock: " + id);
        var ret = confirm("Lock " + id + "?");
        if (ret) {
                ws.send(JSON.stringify({"handler":"lock","opts":{"id":id}}));
        }
}

function lockAll() {
        log("lockAll");
        var idNodes = sebTableBody.querySelectorAll('tr');
        var ids = [];
        for (var i=0;i<idNodes.length;i++) {
                ids.push(idNodes[i].id);
        }
        var ret = confirm("lock all " + defaultFilter + "?");
        if (ret) {
                ws.send(JSON.stringify({"handler":"lockAll","opts":{"ids":ids}}));
        }
        //var rows sebTableBody.getElementBy
}

function unlock(id) {
        log("unlock: " + id);
        var ret = confirm("Unlock " + id + "?");
        if (ret) {
                ws.send(JSON.stringify({"handler":"unlock","opts":{"id":id}}));
        }
}

function unlockAll() {
        log("unlockAll");

        var idNodes = sebTableBody.querySelectorAll('tr');
        var ids = [];
        for (var i=0;i<idNodes.length;i++) {
                ids.push(idNodes[i].id);
        }
        var ret = confirm("unlock all " + defaultFilter + "?");
        if (ret) {
                ws.send(JSON.stringify({"handler":"unlockAll","opts":{"ids":ids}}));
        }
        //var rows sebTableBody.getElementBy
}

function toggleLock(id) {
	log("toggleLock: " + id);
	var el = document.getElementById("lockstatus_"+id);
	var locked = !/^.*?unlocked\.png$/.test(el.src);
	if (locked === true) {
		unlock(id);
	}
	else {
		lock(id);
	}
}

function runTest(id) {
        log("runTest: " + id);
        var ret = confirm("Run Test " + id + "?");
        var test = document.querySelector('#inputTest').value;
        if (ret) {
                ws.send(JSON.stringify({"handler":"runTest","opts":{"id":id,"test":test}}));
        }
}

function runTestAll() {
        log("runTestAll");
        var idNodes = sebTableBody.querySelectorAll('td');
        var ids = [];
        for (var i=0;i<idNodes.length;i++) {
                ids.push(idNodes[i].id);
        }
        var ret = confirm("Run Test all " + defaultFilter + "?");
        if (ret) {
		var test = document.querySelector('#inputTest').value;
                ws.send(JSON.stringify({"handler":"runTestAll","opts":{"ids":ids,"test":test}}));
        }
        //var rows sebTableBody.getElementBy
}

function showPassword(id) {
        log("showPassword: " + id);
        var password = document.querySelector('#inputPassword').value.trim();
        if (password && password.value != "") {
                ws.send(JSON.stringify({"handler":"showPassword","opts":{"id":id,"password":password}}));
        }
	else {
		alert("Please fill password field.");
	}
}

function showPasswordAll() {
        log("showPasswordAll");
        var idNodes = sebTableBody.querySelectorAll('tr');
        var ids = [];
        for (var i=0;i<idNodes.length;i++) {
                ids.push(idNodes[i].id);
        }
        var password = document.querySelector('#inputPassword').value.trim();
	if (password && password.value != "") {
        	ws.send(JSON.stringify({"handler":"showPasswordAll","opts":{"ids":ids,"password":password}}));
	}
        else { 
                alert("Please fill password field.");
        }
        //var rows sebTableBody.getElementBy
}

function hidePassword(id) {
        log("hidePassword: " + id);
        ws.send(JSON.stringify({"handler":"hidePassword","opts":{"id":id}}));       
}

function hidePasswordAll() {
        log("hidePasswordAll");
        var idNodes = sebTableBody.querySelectorAll('tr');
        var ids = [];
        for (var i=0;i<idNodes.length;i++) {
                ids.push(idNodes[i].id);
        }
	ws.send(JSON.stringify({"handler":"hidePasswordAll","opts":{"ids":ids}}));
}

function togglePassword(id) {
        log("togglePassword: " + id);
        var el = document.getElementById("pwdstatus_"+id);
        var hidden = /^.*?pwd_hidden\.svg$/.test(el.src);
        if (hidden === true) {
                showPassword(id);
        }
        else {
                hidePassword(id);
        }
}

//http://caniuse.com/#feat=queryselector
