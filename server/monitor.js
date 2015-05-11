var 	fs 		= require('fs-extra'),
	util 		= require('util'),
	utils		= require('./utils.js'),
	https 		= require('https'),
	WebSocketServer = require('ws').Server,
	conf		= require('./conf.js'),
	sebs		= {},
	out		= utils.out;

const port = 8442;

var server = https.createServer(conf.getServerOptions(), conf.getApp());
var wss = new WebSocketServer({ server: server });
server.listen(port);
wss.on('connection', on_connection);

out('Websocket server for monitoring started on port ' + port);

function on_connection(socket) {
	//console.dir(socket.upgradeReq);
	var cn = socket.upgradeReq.connection.getPeerCertificate().subject.CN;
	if (cn != conf.admCN ) { // only clients with valid user certificates are allowed
		out("invalid user CN: " + cn);
		socket.close();
	}
	else {
		out("monitor: admin connected");
		socket.on('open',on_open);
		socket.on('close',on_close);
		socket.on('message',on_message);
		socket.on('error',on_error);
	}
}

function on_open() {
	out("admin: on_open");
}

function on_close(code, message) {
	out("admin: on_close");
}

function on_message(data, flags) {
	out("admin: on_message: " + data + " flags: " + JSON.stringify(flags));
}

function on_error(error) {
	out("admin: on_error: " + error);
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
	out("monitor: seb socket open");
}

function on_seb_close(code, message, socket) {
	out("monitor: seb socket closed");
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

function addSeb(socket) {
	var ip = socket.upgradeReq.connection.remoteAddress;
	//if { sebs[ip] } 
	sebs["ip"] = ip;
	broadcast( { "handler" : "addSeb", "opts" : { "ip" : ip } } );
	//console.dir(sebs);
	//console.dir(socket.upgradeReq.connection);
	//out("addSeb: " + ip);
}

/*
function encode64(str) {
	return new Buffer(str).toString('base64');
}

function decode64(str) {
	return new Buffer(str,'base64').toString();
}

function encodeHex(str) {
	return new Buffer(str).toString('hex');
}

function decodeHex(str) {
	return new Buffer(str,'hex').toString();
}
*/

// monitor
var monitor = function () {
	if(monitor.caller != monitor.getInstance) {
		throw new Error("This object cannot be instanciated");
	}
	this.wss = null;
	this.init = function(websocketserver) {
		monitor.wss = websocketserver;
		//init_data_table();
		//utils.inspect(monitor.bss);
	}
	this.on_seb_connection = function( socket ) { on_seb_connection( socket, this ); }; // this = websocketserver?
	this.on_seb_connection_error = function( error ) { on_seb_connection_error( error, this ); }; // this = websocketserver?
	this.on_seb_open = function() { on_seb_open( this ); } ; // this = socket
	this.on_seb_close = function(code, message) { on_seb_close(code, message, this); }; // this = socket?
	this.on_seb_error = function(error) { on_seb_error(error, this); };
	this.on_seb_message = function(data, flags) { on_seb_message(data, flags, this); }; // this = socket?
	/*
	this.on_seb_error = function(e) { on_seb_error(e) }; // ToDo
	this.on_seb_close = function() { on_seb_close( this ) }; 
	this.on_seb_message = function() { on_seb_message( this ) }; 
	*/
	
	// in that context "this" is a client object (see: "client.on('close', monitor.on_client_close)" in server.js); 
	/*
	this.on_client_stream = function(stream, meta) { update_stream_info( this, stream, meta ) };
	this.on_stream_data_screenshot = function (client_id) { screenshot_data( client_id, "data" ) }; // "this" is stream object 
	this.on_stream_end_screenshot = function (client_id) { screenshot_data( client_id, "end" ) }; // "this" is stream object 
	*/
}
monitor.instance = null;

monitor.getInstance = function(){
	if(this.instance === null){
		this.instance = new monitor();
	}
	return this.instance;
}

module.exports = monitor.getInstance();


