var 	fs 	= require('fs-extra'),
	express = require('express'),
	static = require('serve-static'),
	directory = require('serve-index'),
	utils	= require('./utils.js');

const 	CA_CN 	= "eqsoft CA",
	USR_CN	= "seb.client",
	ADM_CN	= "seb.admin";


var conf = function conf() {
	if(conf.caller != conf.getInstance){
		throw new Error("This object cannot be instanciated");
	}
	
	this.caCN = CA_CN;
	this.usrCN = USR_CN;
	this.admCN = ADM_CN;
	
	this.getServerOptions = function() {
		var options = 	{
				key:    fs.readFileSync(__dirname + '/ssl/server.key'),
				cert:   fs.readFileSync(__dirname + '/ssl/server.crt'),
				ca:     [ fs.readFileSync(__dirname + '/ssl/ca.crt') ],
				requestCert:        true, 	// client cert is required
				rejectUnauthorized: false 	// reject invalid client certs
				}
		return options;
	}
	
	this.getApp = function() {
		var app = express();
		
		app.use(function(req,res,next) { // Check Auth: only SSL connection with valid client certs are allowed, otherwise ANONYMOUS (demo certs see: user.p12 and admin.p12)
			// this should not be reached in productive ssl environments (rejectUnauthorized = true)
			if (!req.connection.getPeerCertificate().subject) {
				res.writeHead(403, {'Content-Type': 'text/plain'});
				res.end('You need a valid client certificate: wrong client');
			}
			else {
				var subject = null;
				var issuer = null;
				// Safari has problems with client cert handshake on websocket connections!
				try {
					subject = req.connection.getPeerCertificate().subject.CN;
					//console.log("server req subject CN: " + subject);
				}
				catch(e) {
					res.writeHead(403, {'Content-Type': 'text/plain'});
					res.end('SSL Error: failed to get certificate subject CN!');
					return;
				}
				try {
					issuer = req.connection.getPeerCertificate().issuer.CN;
					//console.log("server req issuer CN: " + issuer);
				}
				catch(e) {
					res.writeHead(403, {'Content-Type': 'text/plain'});
					res.end('SSL Error: failed to get certificate issuer!');
					return;
				}
				if (issuer != CA_CN) {
					res.writeHead(403, {'Content-Type': 'text/plain'});
					res.end('You need a valid client certificate: wrong issuer!');
					return;
				}
				next();
			}
		});
		//app.use('/',static(__dirname));
		app.use('/demo',static('demo'));
		app.use('/websocket',static('websocket'));
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
