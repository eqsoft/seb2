var 	fs 		= require('fs-extra'),
	util 		= require('util'),
	utils		= require('./utils.js'),
	https 		= require('https'),
	conf		= require('./conf.js'),
	out		= utils.out,
	WebSocketServer = require('ws').Server,
	monitor		= require('./monitor.js'),
	httpProxy	= require('http-proxy'),
	http		= require('http'),
	url		= require('url'),
	proxyApp	= require('express')(),
	handler		= {
				"screenshot":screenshot
			};
var socketOptions = (conf.socketClientCert) ? conf.getClientCertOptions() : conf.getSSLOptions();
var socketServer = https.createServer(socketOptions, conf.getApp());
var wss = new WebSocketServer({ server: socketServer });
monitor.init(wss);
wss.on('connection',on_connection);
//wss.on('connection',monitor.on_seb_connection);
wss.on('error',on_connection_error);
wss.on('error',monitor.on_seb_connection_error);
socketServer.listen(conf.socketPort);
console.log('Websocket started on port ' + conf.socketPort);

if (conf.demoApp) {
	var demoOptions = (conf.demoClientCert) ? conf.getClientCertOptions() : conf.getSSLOptions();
	httpsServer = https.createServer(demoOptions, conf.getApp());
	httpsServer.listen(conf.demoPort);
	console.log('HTTPS server for seb demo app started on port ' + conf.demoPort);
}

if (conf.sendApp) {
	httpServer = http.createServer(conf.getApp());
	httpServer.listen(conf.sendPort);
	console.log('HTTP server for send app started on port ' + conf.sendPort);
}

if (conf.proxy) {
	// Create proxy server
	if (conf.proxyAuth) {
		httpProxy.createServer(conf.basic, {
			target: conf.proxyTarget
		}).listen(conf.proxyServerPort);
	}
	else {
		httpProxy.createServer({
			target: conf.proxyTarget
		}).listen(conf.proxyServerPort);
	}

	// Create target server.
	http.createServer(function (req, res) {
		res.end("Request successfully proxied!");
	}).listen(conf.proxyTargetPort);
	console.log('proxy server on port ' + conf.proxyServerPort + " for " + conf.proxyTarget + " request");
}

function on_connection(socket) {
	//console.log(wss.clients);
	if (conf.socketClientCert) {
		var cn = null;
		try {
			//var c = socket.upgradeReq.connection;
			//console.dir(c);
			cn = socket.upgradeReq.connection.getPeerCertificate().subject.CN;
		}
		catch(e) {
			console.log("No valid client certificate enbedded in seb\n" + e);
			return;
		}
		if (cn != conf.usrCN ) { // only clients with valid user certificates are allowed
			out("invalid user CN: " + cn);
			socket.close();
			return;
		}
	}

	out("seb client connected");
	monitor.on_seb_connection(socket);
	socket.on('open',on_open);
	socket.on('open',monitor.on_seb_open);
	socket.on('close',on_close);
	socket.on('close',monitor.on_seb_close);
	socket.on('message',on_message);
	socket.on('message',monitor.on_seb_message);
	socket.on('error',on_error);
	socket.on('error',monitor.on_seb_error);

}

function on_connection_error(error) {
	out("server: connection error: " + error);
}

function on_open() {
	out("server: on_open");
}

function on_close(code, message) {
	out("server: on_close");
}

function on_message(data, flags) {
	var obj = JSON.parse(data);
	var h = handler[obj.handler];
	if (typeof h === 'function') {
		h.apply(this, [obj.opts, data]);
	}
}

function on_error(error) {
	out("server: on_error: " + error);
}

/* handler */

function screenshot(opts, data) {
	out("screenshot: " + opts);
	var p = opts.file.path.join("/");
	var filepath = __dirname + '/websocket/data/' + p;
	out(filepath);
	fs.mkdirs(filepath, function() {
		var filestream = fs.createWriteStream(filepath + '/' + opts.file.filename);
		filestream.on('finish', function () {
  			out("file has been written");
		});
		var buffer = new Buffer(opts.data,'base64');
		filestream.write(buffer);
		filestream.end();
	});
}
