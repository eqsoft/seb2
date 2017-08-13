importScripts('resource://gre/modules/workers/require.js');
importScripts('resource://gre/modules/osfile.jsm');
let PromiseWorker = require('resource://gre/modules/workers/PromiseWorker.js');


let worker = new PromiseWorker.AbstractWorker();
worker.dispatch = function(method, args = []) {
  return self[method](...args);
};
worker.postMessage = function(...args) {
  self.postMessage(...args);
};
worker.close = function() {
  self.close();
};
worker.log = function(...args) {
  dump('Worker: ' + args.join(' ') + '\n');
};
self.addEventListener('message', msg => worker.handleMessage(msg));

// start - my functionalities

function resolveTest(shouldResolve) {
	var promise = OS.File.removeDir("/tmp/test", { ignoreAbsent : true, ignorePermissions: true });
	promise = promise.then(
		function onSuccess(file) {
			return "success";
			dump("success");
		},
		function onError(file) {
			throw new Error("error");
		}
	);
	/*
	if (shouldResolve) {
		return 'You sent to PromiseWorker argument of: `' + shouldResolve + '`';
	} 
	else {
		throw new Error('You passed in a non-true value for shouldResolve argument and therefore this will reject the main thread promise');
	}
	*/ 
}

function removeProfile() {
	return "sdfsdfsdf";
	//return OS.File.removeDir(OS.Constants.Path.profileDir,{ignoreAbsent : true, ignorePermissions: true });
	/*
	var promise = OS.File.removeDir("/tmp/test", { ignoreAbsent : true, ignorePermissions: true });
	promise = promise.then(
		function onSuccess() {
			return "supi";
		},
		function onError() {
			throw new Error("doof");
		}
	);
	*/ 
}
