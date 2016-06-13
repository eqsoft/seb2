var WebSocketServer = require('ws').Server
, fs = require('fs-extra')
, port = 8706
, wss = new WebSocketServer({port: 8706});

wss.on('connection', function(ws) {
	ws.on('message', function(message,data) {
		if (data.binary) { // just for testing seb file transfer
			var filepath = __dirname + '/websocket/data/test.seb';
			var reconfpath = __dirname + '/websocket/data/base64.json';
			//console.dir(message);
			var buffer = new Buffer(message);
			var filestream = fs.createWriteStream(filepath);
			
			var h = {Handler:"SebFileTransfer",Opts:false};
			var r = {Handler:"Reconfigure",Opts:{configBase64:""}};
			filestream.on('finish', function () {
				console.log("file has been written");
				h.Opts = true;
				wss.clients.forEach(function each(client) {
					client.send(JSON.stringify(h));
					setTimeout(function() { // just wait for 3 seconds
						fs.readFile(reconfpath, 'utf8', function(err, data) {
							r.Opts.configBase64 = data.trim();
							wss.clients.forEach(function each(client) {
								client.send(JSON.stringify(r));
							});
						 });
					},3000);
				});
			});
			filestream.on('error', function () {
				h.Opts = false;
				console.log("file error");
				wss.clients.forEach(function each(client) {
					client.send(JSON.stringify(h));
				});
			});
			filestream.write(buffer);
			filestream.end();
		}
		else {
			wss.clients.forEach(function each(client) {
				client.send(message);
			});
			console.log('received: %s', message);
		}
	});
	ws.send('message server connected');
});
console.log('message server started on port '+ port);
