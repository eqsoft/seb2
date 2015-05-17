var 	fs 		= require('fs-extra'),
	util 		= require('util'),
	utils		= require('./utils.js'),
	https 		= require('https'),
	conf		= require('./conf.js'),
	out		= utils.out,
	WebSocketServer = require('ws').Server,
	monitor		= require('./monitor.js'),
	handler		= {
				"screenshot":screenshot
			};

const port = 8443;

var server = https.createServer(conf.getServerOptions(), conf.getApp());
var wss = new WebSocketServer({ server: server });
monitor.init(wss);
wss.on('connection',on_connection);
wss.on('connection',monitor.on_seb_connection);
wss.on('error',on_connection_error);
wss.on('error',monitor.on_seb_connection_error);

server.listen(port);
console.log('HTTPS server for SEB Server started on port ' + port);
console.log('Socket server for SEB Server started on port ' + port);


function on_connection(socket) {
	//console.log(wss.clients);
	var cn = socket.upgradeReq.connection.getPeerCertificate().subject.CN;
	if (cn != conf.usrCN ) { // only clients with valid user certificates are allowed
		out("invalid user CN: " + cn);
		socket.close();
	}
	else {
		out("seb client connected");
		socket.on('open',on_open);
		socket.on('open',monitor.on_seb_open);
		socket.on('close',on_close);
		socket.on('close',monitor.on_seb_close);
		socket.on('message',on_message);
		socket.on('message',monitor.on_seb_message);
		//socket.on('stream',on_stream);
		socket.on('error',on_error);
		socket.on('error',monitor.on_seb_error);
	}
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
