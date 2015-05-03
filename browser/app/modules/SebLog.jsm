/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the browser component of seb.
 *
 * The Initial Developer of the Original Code is Stefan Schneider <schneider@hrz.uni-marburg.de>.
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Stefan Schneider <schneider@hrz.uni-marburg.de>
 *   
 * ***** END LICENSE BLOCK ***** */

/* ***** GLOBAL seb SINGLETON *****

* *************************************/ 

/* 	for javascript module import
	see: https://developer.mozilla.org/en/Components.utils.import 
*/

this.EXPORTED_SYMBOLS = ["SebLog"];

/* Modules */
const 	{ classes: Cc, interfaces: Ci, results: Cr, utils: Cu } = Components,
	{ appinfo } = Cu.import("resource://gre/modules/Services.jsm").Services;
	
/* Services */
let console = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);

/* ModuleGlobals */
let os = "";
let lf = "\n";
let seb = null;
let message = {};

this.SebLog = {
	init : function(obj) {
		seb = obj;
		os = appinfo.OS.toUpperCase();
		switch (os) { // line feed for dump messages
			case "WINNT" :
				lf = "\n\r";
				break;
			case "UNIX" :
			case "LINUX" :
				lf = "\n";
				break;
			case "DARWIN" :
				lf = "\n";
				break;
			default :
				lf = "\n";
		}
		this.out("SebLog initialized: " + seb);
	},
	out : function(msg) {
		let str = appinfo.name + " out : " + msg;
		console.logStringMessage(str);
		dump(str + lf);
	},
	debug : function(msg) {
		if (typeof seb === "object" && !seb.DEBUG) {
			return;
		}
		let str = appinfo.name + " debug : " + msg;
		console.logStringMessage(str);
		dump(str + lf);
	},
	err : function(msg) {
		let str = appinfo.name + " err : " + msg;
		Cu.reportError(str);
		dump(str + lf);
	}
}

/*
this.init_log = function(obj) {
	os = appinfo.OS.toUpperCase();
	switch (os) { // line feed for dump messages
		case "WINNT" :
			lf = "\n\r";
			break;
		case "UNIX" :
		case "LINUX" :
			lf = "\n";
			break;
		case "DARWIN" :
			lf = "\n";
			break;
		default :
			lf = "\n";
	}
	seb = obj;
	DEBUG = seb.getDebug();
}


this.out = function (msg,ctx) { // for app messages
	ctx = (ctx) ? ctx : APPNAME;
	let str = ctx + ": " + msg;
	console.logStringMessage(str);
	dump(str + lf);
	//writeLogFile(str);
	//sendMessage(str);
}
	
this.debug = function (msg,ctx) { // for debugging
	if (!DEBUG) return;	
	ctx = (ctx) ? ctx : APPNAME;		
	var str = ctx + ": " + msg;
	console.logStringMessage(str);
	//c = seb.getConfig();
	//out("2"+seb.getConfig().startURL);
	dump(str + lf);
	//writeLogFile(str);
	//sendMessage(str);
}
	
this.err = function (obj,ctx) { // error messages
	ctx = (ctx) ? ctx : APPNAME;
	var str = ctx + ": " + obj;
	Cu.reportError(str);
	dump(str + lf);
	//writeLogFile("err: "+str);
	//sendMessage("err: "+str);
}
*/
