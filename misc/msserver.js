var WebSocketServer = require('ws').Server
, fs = require('fs-extra')
, port = 8706
, wss = new WebSocketServer({port: 8706});

wss.on('connection', function(ws) {
	ws.on('message', function(message,data) {
		
		//if (message.indexOf("%") > -1) {
		if (data.binary) { // just for testing
			var filepath = __dirname + '/websocket/data/test.seb';
			//console.dir(message);
			var buffer = new Buffer(message);
			/*
			var v = new Uint8Array(message.split("%"));
			
			console.dir(v);
			
			var b = new Buffer(v);
			*/ 
			//var s = String.fromCharCode.apply(null,b);
			//console.log(String.fromCharCode.apply(null,v));
			/*
			var b = new Buffer(message.length);
			var v = new Uint8Array(b);
			for (var i = 0; i < b.length; ++i) {
				b[i] = v[i];
			}
			*/
			/*
			var s = "";
			for (var i = 0; i < message.length; ++i) {
				s += String.fromCharCode.apply(null,message[i]);
				//s += message[i].charCodeAt();
			}
			*/
			//console.log(s);
			
			/*
			fs.writeFile(filepath, b,  "binary", function(err) {
				if(err) {
					console.log(err);
				} 
				else {
					console.log("The file was saved!");
				}
			});
			*/
			var filestream = fs.createWriteStream(filepath);
			
			var h = {Handler:"SebFileTransfer",Opts:false};
			filestream.on('finish', function () {
				console.log("file has been written");
				h.Opts = true;
				wss.clients.forEach(function each(client) {
					client.send(JSON.stringify(h));
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
			
			//console.dir(message
			//console.dir(data);
			
			//console.log(message.join(""));
			
			//var b = new Buffer(message.buffer);
			//var b = new Buffer(new Uint8Array(message));
			//var dec = dec.decode(message);
			//console.log(dec);
			//filestream.write(message.join(""));
			//filestream.end();
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
