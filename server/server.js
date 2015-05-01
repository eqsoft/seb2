var 	util 	= require('util'),
	utils	= require('./utils.js'),
	https 	= require('https'),
	conf	= require('./conf.js'),
	out	= utils.out;

const port = 8443;

var server = https.createServer(conf.getServerOptions(), conf.getApp());
server.listen(port);

console.log('HTTPS server for SEB Server started on port ' + port);

function con(client) {
	var cn = client._socket.upgradeReq.connection.getPeerCertificate().subject.CN;
	if (cn != conf.usrCN ) { // only clients with valid user certificates are allowed
		out("invalid user CN: " + cn);
		client.close();
	}
	else {
		out("seb client connected");
	}
}