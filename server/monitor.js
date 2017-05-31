var 	fs 		= require('fs-extra'),
	util 		= require('util'),
	utils		= require('./utils.js'),
	crypt		= require('crypto'),
	https 		= require('https'),
	WebSocketServer = require('ws').Server,
	conf		= require('./conf.js'),
	sebs		= {}, // public sebs with radmon key for table gui
	_sebs		= {}, // internal sebs with socket object
	sebmap		= {}, // mapping from wskey to key
	out		= utils.out,
	adminsExist	= false,
	handler		= {
				"shutdown":shutdown,
				"shutdownAll":shutdownAll,
				"reboot":reboot,
				"rebootAll":rebootAll
			};
var monitorOptions = (conf.monitorClientCert) ? conf.getClientCertOptions() : conf.getSSLOptions();
var monitorServer = https.createServer(monitorOptions, conf.getApp());
var wss = new WebSocketServer({ server: monitorServer });
monitorServer.listen(conf.monitorPort);
wss.on('connection', on_connection);

out('Websocket for monitoring started on port ' + conf.monitorPort);

//var _checkSebConnections = setInterval(checkSebConnections,10000);

function checkSebConnections() {
	// if no admins connected return;
	if (!adminsExist) { return };
	// if no _sebs sockets return
	//console.log("checkSebConnections");
	for (var k in _sebs) {
		var sock = _sebs[k].socket;
		switch (sock.readyState) { // does not make sense, i have to check the socket connection with ping/pong heartbeat
			case sock.CLOSED :
				// check readystate of socket on hardkilled OS
				// broadcast dead socket to admin clients?
				console.log("seb zombie!");
			break;
		}
		// check socket connections
	}
}

function on_connection(socket) {
	//console.dir(socket.upgradeReq);
	//console.log(socket.CONNECTING);
	//console.log(socket.CLOSED);
	if (conf.monitorClientCert) {
		var cn = null;
		try {
			//var c = socket.upgradeReq.connection.getPeerCertificate();
			//console.dir(c);
			cn = socket.upgradeReq.connection.getPeerCertificate().subject.CN;
		}
		catch(e) {
			console.log(e);
			socket.send(JSON.stringify({"handler":"socketError","opts":{"error":"failed client certificate handshake on socket connection"}}));
			socket.close();
			//console.dir(socket);
			return;
		}
		if (cn != conf.admCN ) { // only clients with valid user certificates are allowed
			out("invalid user CN: " + cn);
			socket.close();
			return;
		}
	}

	out("monitor: admin connected");
	adminsExist = true;
	addData(socket);
	socket.on('open',on_open);
	socket.on('close',on_close);
	socket.on('message',on_message);
	socket.on('error',on_error);
}

function on_open() {
	out("admin: on_open");
}

function on_close(code, message) {
	out("admin: on_close");
	adminsExist = (wss.clients.length > 0);
}

function on_message(data, flags) {
	out("admin: on_message: " + data + " flags: " + JSON.stringify(flags));
	var obj = JSON.parse(data);
	var h = handler[obj.handler];
	if (typeof h === 'function') {
		h.apply(undefined, [obj.opts, data]);
	}
}

function on_error(error) {
	out("admin: on_error: " + error);
}

function addData(socket) {
	socket.send(JSON.stringify({"handler":"addData","opts":sebs}));
}

/* seb clients */
function on_seb_connection(socket, server) {
	out("monitor: seb connected");
	addSeb(socket);
}

function on_seb_connection_error(error, server) {
	out("monitor: seb connection error");
}

function on_seb_open(socket) {
	/*
	 * http://django-websocket-redis.readthedocs.org/en/latest/heartbeats.html
	var heartbeat_msg = '--heartbeat--', heartbeat_interval = null, missed_heartbeats = 0;
	if (heartbeat_interval === null) {
        missed_heartbeats = 0;
        heartbeat_interval = setInterval(function() {
            try {
                missed_heartbeats++;
                if (missed_heartbeats >= 3)
                    throw new Error("Too many missed heartbeats.");
                ws.send(heartbeat_msg);
            } catch(e) {
                clearInterval(heartbeat_interval);
                heartbeat_interval = null;
                console.warn("Closing connection. Reason: " + e.message);
                ws.close();
            }
        }, 5000);
    }
    */
	out("monitor: seb socket open");
}

function on_seb_close(code, message, socket) {
	out("monitor: seb socket closed");
	removeSeb(socket);
}

function on_seb_error(error, socket) {
	out("monitor: seb socket error");
}

function on_seb_message(data, flags, socket) {
	out("monitor: seb socket message");
}

function broadcast(data) { // to all connected admin clients
	for (var k in wss.clients) {
		var c = wss.clients[k];
		c.send(JSON.stringify(data));
	}
}

function addSeb(socket, data) {
	var ip = socket.upgradeReq.connection.remoteAddress.replace(/[f\:]/g,"");
	var id = crypt.randomBytes(16).toString('hex');
	var wskey = socket.upgradeReq.headers['sec-websocket-key'];
	var seb = {"id":id,"ip":ip};
	sebs[id] = seb;
	_sebs[id] = {"socket":socket};
	sebmap[wskey] = id;
	broadcast( { "handler" : "addSeb", "opts" : seb } );
}

function removeSeb(socket, data) {
	var wskey = socket.upgradeReq.headers['sec-websocket-key'];
	var id = sebmap[wskey];
	broadcast( { "handler" : "removeSeb", "opts" : sebs[id] } );
	delete sebs[id];
	delete sebmap[wskey];
	delete _sebs[id];
}

/* handler */
function shutdown(seb,data) {
	out("monitor: shutdown " + seb.id);
	var socket = _sebs[seb.id].socket;
	try {
		socket.send(data); // forward data (same handler and opts object expected on seb client)
	}
	catch(e) {
		console.log(e);
	}
	//out("monitor: socket " + socket.send);
}

function shutdownAll(seb,data) {
	out("monitor: shutdownAll " + JSON.stringify(seb.ids));
	for (var idx in seb.ids) {
		var id = seb.ids[idx];
		shutdown({"id":id},JSON.stringify({"handler":"shutdown","opts":{"id":id}}));
	}
}

function reboot(seb,data) {
        out("monitor: reboot " + seb.id);
        var socket = _sebs[seb.id].socket;
        try {
                socket.send(data); // forward data (same handler and opts object expected on seb client)
        }
        catch(e) {
                console.log(e);
        }
        //out("monitor: socket " + socket.send);
}

function rebootAll(seb,data) {
        out("monitor: rebootAll " + JSON.stringify(seb.ids));
        for (var idx in seb.ids) {
                var id = seb.ids[idx];
                reboot({"id":id},JSON.stringify({"handler":"reboot","opts":{"id":id}}));
        }
}

// monitor
var monitor = function () {
	if(monitor.caller != monitor.getInstance) {
		throw new Error("This object cannot be instanciated");
	}
	this.wss = null;
	this.init = function(websocketserver) {
		monitor.wss = websocketserver;
	}
	this.on_seb_connection = function( socket ) { on_seb_connection( socket, this ); };
	this.on_seb_connection_error = function( error ) { on_seb_connection_error( error, this ); };
	this.on_seb_open = function() { on_seb_open( this ); } ;
	this.on_seb_close = function(code, message) { on_seb_close(code, message, this); };
	this.on_seb_error = function(error) { on_seb_error(error, this); };
	this.on_seb_message = function(data, flags) { on_seb_message(data, flags, this); }; }
monitor.instance = null;

monitor.getInstance = function(){
	if(this.instance === null){
		this.instance = new monitor();
	}
	return this.instance;
}

module.exports = monitor.getInstance();
