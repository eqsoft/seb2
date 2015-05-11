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
					addSeb, 
					removeSeb 
				};

function init() {
	msg = document.getElementById("message");
	log("init");
	prot = (window.location.protocol === "https:") ? "wss:" : "ws:"; // for ssl
	sock_url = prot + "//" + window.location.host; 
	ws = new WebSocket(sock_url);
	ws.onopen = on_open;
	ws.onclose = on_close;
	ws.onmessage = on_message;
	ws.onerror = on_error;
	sebTable = document.getElementById("sebTable");
	sebTableHead = document.getElementById("sebTableHead");
	sebTableBody = document.getElementById("sebTableBody");
}

function on_open() {
	log("on_open");
}

function on_close() {
	log("on_close");
}

function on_message(e) {
	log("on_message: " + e.data);
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

function addSeb(opts) {
	log("addSeb: " + JSON.stringify(opts));
}

function removeSeb() {
	log("removeSeb: " + JSON.stringify(opts));
}