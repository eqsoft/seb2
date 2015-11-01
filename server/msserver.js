var WebSocketServer = require('ws').Server
, port = 8706
, wss = new WebSocketServer({port: 8706});
wss.on('connection', function(ws) {
	ws.on('message', function(message) {
		wss.clients.forEach(function each(client) {
			client.send(message);
		});
		console.log('received: %s', message);
	});
	ws.send('message server connected');
});
console.log('message server started on port '+ port);
