var 	fs 	= require('fs-extra'),
	path	= require('path'),
	express = require('express'),
	static = require('serve-static'),
	fileUpload = require('express-fileupload'),
	basicAuth = require('basic-auth'),
	auth = require('http-auth'),
	basic = auth.basic({
		realm: "Basic Area",
		file: __dirname + "/users"
	});
	directory = require('serve-index'),
	utils	= require('./utils.js');

const 	CA_CN 	= "Simple Signing CA",
	USR_CN	= "seb.client",
	ADM_CN	= "seb.admin",
	monitorPort = 8441,
	socketPort = 8442,
	demoApp = true,
	demoPort = 8443,
	sendApp = true,
	sendPort = 8080,
	demoClientCert = false,
	socketClientCert = false,
	monitorClientCert = false,
	proxy = true,
	proxyServerPort = 8337,
	proxyTargetPort = 8338,
	proxyTarget = 'http://www.simple.org:'+proxyTargetPort,
	proxyAuth = true;

var conf = function conf() {
	if(conf.caller != conf.getInstance){
		throw new Error("This object cannot be instantiated");
	}

	this.caCN = CA_CN;
	this.usrCN = USR_CN;
	this.admCN = ADM_CN;
	this.monitorPort = monitorPort;
	this.socketPort = socketPort;
	this.demoApp = demoApp;
	this.demoPort = demoPort;
	this.sendApp = sendApp;
	this.sendPort = sendPort;
	this.demoClientCert = demoClientCert;
	this.socketClientCert = socketClientCert;
	this.monitorClientCert = monitorClientCert;
	this.proxy = proxy;
	this.proxyServerPort = proxyServerPort;
	this.proxyTargetPort = proxyTargetPort;
	this.proxyTarget = proxyTarget;
	this.proxyAuth = proxyAuth;
	this.auth = auth;
	this.basic = basic;

	this.getClientCertOptions = function() {
		var options = 	{
				key:    fs.readFileSync(__dirname + '/ssl/simple.org.key'),
				cert:   fs.readFileSync(__dirname + '/ssl/simple.org.crt'),
				ca:     [
						fs.readFileSync(__dirname + '/ssl/root-ca.crt'),
						fs.readFileSync(__dirname + '/ssl/signing-ca.crt')
					],
				requestCert:        true, 	// client cert is required
				rejectUnauthorized: false 	// reject invalid client certs
				}
		return options;
	}

	this.getSSLOptions = function() {
		var options = 	{
				key:    fs.readFileSync(__dirname + '/ssl/simple.org.key'),
				cert:   fs.readFileSync(__dirname + '/ssl/simple.org.crt'),
				ca:     [
						fs.readFileSync(__dirname + '/ssl/root-ca.crt'),
						fs.readFileSync(__dirname + '/ssl/signing-ca.crt')
					],
				requestCert:        false, 	// client cert is required
				rejectUnauthorized: false 	// reject invalid client certs
				}
		return options;
	}

	this.getApp = function() {
		var app = express();
		app["__port"] = 0;
		var checkClientCert = false;

		// get port
		app.use(function(req,res,next) {
			if (req.socket.server && req.socket.server.address) {
				app["__port"] = req.socket.server.address().port;
			}
			else {
				if (req.socket.pair && req.socket.pair.server && req.socket.pair.server.address) {
					app["__port"] = req.socket.pair.server.address().port;
				}
			}
			if (app.__port == 0) {
				console.log('can not get port');
				res.writeHead(403, {'Content-Type': 'text/plain; charset=utf-8'});
				res.end('can not get port');
			}
			else {
				next();
			}
		});

		// check client certs
		app.use(function(req,res,next) { // Check Auth: only SSL connection with valid client certs are allowed, otherwise ANONYMOUS (demo certs see: user.p12 and admin.p12
			if (app.__port == demoPort && demoClientCert) {
				checkClientCert = true;
			}

			if (app.__port == socketPort && socketClientCert) {
				checkClientCert = true;
			}

			if (app.__port == monitorPort && monitorClientCert) {
				checkClientCert = true;
			}

			if (checkClientCert) {
				// this should not be reached in productive ssl environments (rejectUnauthorized = true)
				if (!req.connection.getPeerCertificate().subject) {
					res.writeHead(403, {'Content-Type': 'text/plain; charset=utf-8'});
					res.end('You need a valid client certificate: wrong client');
				}
				else {

					var subject = null;
					var issuer = null;
					// Safari has problems with client cert handshake on websocket connections!
					try {
						subject = req.connection.getPeerCertificate().subject.CN;
						console.log("server req subject CN: " + subject);
					}
					catch(e) {
						res.writeHead(403, {'Content-Type': 'text/plain; charset=utf-8'});
						res.end('SSL Error: failed to get certificate subject CN!');
						return;
					}
					try {
						issuer = req.connection.getPeerCertificate().issuer.CN;
						//console.log("server req issuer CN: " + issuer);
					}
					catch(e) {
						res.writeHead(403, {'Content-Type': 'text/plain; charset=utf-8'});
						res.end('SSL Error: failed to get certificate issuer!');
						return;
					}
					if (issuer != CA_CN) {
						res.writeHead(403, {'Content-Type': 'text/plain; charset=utf-8'});
						res.end('You need a valid client certificate: wrong issuer!');
						return;
					}
					next();
				}
			}
			else {
				next();
			}
		});

		app.use('/',static(__dirname));
		app.use('/basic',auth.connect(basic));
		app.use('/basic',static('demo'));
		app.use('/demo', static('demo'));
		app.use('/send', static('websocket/send.html'));
		app.use('/websocket',static('websocket'));
		app.use('/websocket/data',directory('websocket/data'));
		app.use('download_basic',auth.connect(basic));
		app.use('/download_pdf', function(req, res) {
			var file = __dirname + '/demo/res/test.pdf';
			var filename = path.basename(file);
			//var mimetype = mime.lookup(file);
			res.setHeader('Content-disposition', 'inline; filename=' + filename);
			var filestream = fs.createReadStream(file);
			filestream.pipe(res);
		});
		app.use('/stream_pdf', function(req, res) {
			var file = __dirname + '/demo/res/test.pdf';
			var filename = path.basename(file);
			//var mimetype = mime.lookup(file);
			res.setHeader('Content-type', 'application/pdf');
			var filestream = fs.createReadStream(file);
			filestream.pipe(res);
		});
		app.use('/download_basic', function(req, res) {
			var file = __dirname + '/demo/res/test.seb';

			var filename = path.basename(file);
			//var mimetype = mime.lookup(file);

			res.setHeader('Content-disposition', 'attachment; filename=' + filename);
			//res.setHeader('Content-type', mimetype);

			var filestream = fs.createReadStream(file);
			filestream.pipe(res);
		});
		app.use('/download', function(req, res) {
			var file = __dirname + '/demo/res/test.seb';

			var filename = path.basename(file);
			//var mimetype = mime.lookup(file);

			res.setHeader('Content-disposition', 'attachment; filename=' + filename);
			//res.setHeader('Content-type', mimetype);

			var filestream = fs.createReadStream(file);
			filestream.pipe(res);
		});
		app.use(fileUpload());
		app.post('/upload', function(req, res) {
			if (!req.files) 
				return res.status(400).send('No files were uploaded.');

			
			let sampleFile = req.files.sampleFile;

			// Use the mv() method to place the file somewhere on your server
			sampleFile.mv('./upload/upload.file', function(err) {
				if (err)
					return res.status(500).send(err);

				res.send('File uploaded!');
			});
		});
		app.use('/error', function(req, res) {
			res.statusMessage = "Kein Kontakt";
			res.status(503).end();
		});
		
		return app;
	}
}

conf.instance = null;

/**
 * Singleton getInstance definition
 * @return singleton class
 */
conf.getInstance = function(){
	if(this.instance === null){
		this.instance = new conf();
	}
	return this.instance;
}

module.exports = conf.getInstance();
