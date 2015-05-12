window.onload = init;
var 	prot 		= "",
	sock_url 	= "", 
	msg		= null,
	ws		= null,
	sebTable	= null,
	sebTableHead 	= null,
	sebTableBody 	= null,
	ws		= null,
	handler		= 	{ 
					addData,
					addSeb, 
					removeSeb 
				};

function init() {
	msg = document.getElementById("message");
	log("init");
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
	obj = JSON.parse(e.data);
	h = handler[obj.handler];
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
	//log("addData: " + JSON.stringify(sebs));
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
}

/* GUI */
function resetTable() {
}

function addRow(seb) {
	log("addRow: " + JSON.stringify(seb));
	var row = sebTableBody.insertRow(0);
	var idCell = row.insertCell(0);
	var ipCell = row.insertCell(1);
	var sdCell = row.insertCell(2);
	idCell.innerHTML = seb.id;
	ipCell.innerHTML = seb.ip;
	sdCell.innerHTML = '<input type="button" id="' + seb.id + '" value="shutdown" onclick="shutdown(this);" />';
}

function shutdown(el) {
	alert(el.id);
}
