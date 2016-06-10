var 	fs 	= require('fs-extra'),
	path	= require('path'),
	express = require('express'),
	static = require('serve-static'),
	basicAuth = require('basic-auth'),
	directory = require('serve-index'),
	utils	= require('./utils.js');

const 	CA_CN 	= "Simple Signing CA",
	USR_CN	= "seb.client",
	ADM_CN	= "seb.admin",
	monitorPort = 8441,
	socketPort = 8442,
	demoPort = 8443,
	demoClientCert = false,
	demoBasicAuth = false,
	demoUser = 'demo',
	demoPass = 'demo',
	socketClientCert = false,
	monitorClientCert = false;

var conf = function conf() {
	if(conf.caller != conf.getInstance){
		throw new Error("This object cannot be instanciated");
	}
	
	this.caCN = CA_CN;
	this.usrCN = USR_CN;
	this.admCN = ADM_CN;
	this.monitorPort = monitorPort;
	this.socketPort = socketPort;
	this.demoPort = demoPort;
	this.demoClientCert = demoClientCert;
	this.demoBasicAuth = demoBasicAuth;
	this.demoUser = demoUser;
	this.demoPass = demoPass;
	this.socketClientCert = socketClientCert;
	this.monitorClientCert = monitorClientCert;
	
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
	
	this.getOptions = function() {
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
		
		
		app.use(function(req,res,next) { // Check Auth: only SSL connection with valid client certs are allowed, otherwise ANONYMOUS (demo certs see: user.p12 and admin.p12
			// don't request client certificates for demo web app
			function unauthorized(res) {
				res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
				if (typeof(res.sendStatus) == 'function') {
					return res.sendStatus(401);
				}
				else {
					return res.status(401).send();
				}
			};
			
			var port = 0;
			var checkClientCert = false;
			if (req.socket.server && req.socket.server.address) {
				port = req.socket.server.address().port;
			}
			else {
				if (req.socket.pair && req.socket.pair.server && req.socket.pair.server.address) {
					port = req.socket.pair.server.address().port;
				}
			}
			if (port == 0) {
				console.log('can not get port');
				res.writeHead(403, {'Content-Type': 'text/plain; charset=utf-8'});
				res.end('can not get port');
			}
			
			if (port == demoPort && demoClientCert) {
				checkClientCert = true;
			}
			
			if (port == demoPort && demoBasicAuth) {
				checkClientCert = false; // don't check client cert
				var user = basicAuth(req);
				if (!user) {
					console.log('no credentials recieved');
					return unauthorized(res);
				};
				
				if (user.name === demoUser && user.pass === demoPass) {
					return next();
				}
				else {
					return unauthorized(res);
				}
			}
			
			if (port == socketPort && socketClientCert) {
				checkClientCert = true;
			}
			
			if (port == monitorPort && monitorClientCert) {
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
		app.use('/demo', static('demo'));
		app.use('/websocket',static('websocket'));
		app.use('/websocket/data',directory('websocket/data'));
		app.use('/download', function(req, res) {
			var file = __dirname + '/demo/res/test.seb';

			var filename = path.basename(file);
			//var mimetype = mime.lookup(file);

			res.setHeader('Content-disposition', 'attachment; filename=' + filename);
			//res.setHeader('Content-type', mimetype);

			var filestream = fs.createReadStream(file);
			filestream.pipe(res);
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
