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

this.EXPORTED_SYMBOLS = ["SebHost"];

/* Modules */
const 	{ classes: Cc, interfaces: Ci, results: Cr, utils: Cu } = Components;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

/* Services */

/* SebModules */
XPCOMUtils.defineLazyModuleGetter(this,"sl","resource://modules/SebLog.jsm","SebLog");
XPCOMUtils.defineLazyModuleGetter(this,"su","resource://modules/SebUtils.jsm","SebUtils");

/* ModuleGlobals */
let 	base = null,
	seb = null,
	socket = "",
	pingtime = "",
	socketlog = false,
	messageSocketBrowser = null,
	messageSocketWin = null,
	messageSocket = null;
	
	
this.SebHost = {
	
	messageServer : false,
	
	init : function(obj) {
		base = this;
		seb = obj;
		socketlog = su.getBool(su.getCmd("socketlog"));
		sl.out("SebHost initialized: " + seb);
	},
	
	messageSocketListener : function (e) {
		sl.debug("setMessageSocketListener");
		messageSocketWin = messageSocketBrowser.contentWindow.wrappedJSObject;
		const { WebSocket } = messageSocketWin;
		
		try {
			messageSocket = new WebSocket(socket);
			sl.debug("messageSocket: " + typeof messageSocket)
		}
		catch (e) {
			sl.debug("messageSocket connection failed: " + socket + "\n"+e);
			messageSocket = null;
			return; 
		}
		
		messageSocket.onopen = function(evt) { 			
			sl.debug("messageSocket open: " + evt); 
			messageSocket.send("seb.connected"); 
			base.messageServer = true;
			sl.debug("set ping intervall " + pingtime);
			messageSocketWin.setInterval(function() {
				messageSocket.send("seb.ping"); 
			} ,pingtime);
		}
			
		messageSocket.onclose = function(e) { 
			sl.debug("messageSocket close: " + e); 
			messageSocket = null; 
			messageServer = false;
		}; 
		
		messageSocket.onmessage = function(evt) { 
			// ToDo: message handling
			switch (evt.data) {
				case "SEB.close" :
					sl.debug("messageSocket handled: " + evt.data); 
					//hostForceShutdown = true;
					break;
				case "SEB.restartExam" :
					sl.debug("messageSocket handled: " + evt.data);
					//hostRestartUrl();
					break;
				case "SEB.displaySettingsChanged" :
					sl.debug("messageSocket handled: " + evt.data);
					//hostDisplaySettingsChanged();
					break;
				case "SEB.reload" :
					sl.debug("messageSocket handled: " + evt.data);
					//reload(null);
					break;
				default :
					sl.debug("messageSocket not handled msg: " + evt.data); 
			}
		};
		 
		messageSocket.onerror = function(e) { 
			sl.debug("messageSocket err: " + e); 
			messageSocket = null;
			base.messageServer = false; 
		};
		
		e.preventDefault();
		e.stopPropagation();
	},
	
	setMessageSocketHandler : function (win) {
		sl.debug("setMessageSocketHandler");
		socket = su.getConfig("browserMessagingSocket","string","");
		if (socket == "") { 
			sl.debug("no message server defined."); 
			return
		}
		pingtime = parseInt(su.getConfig("browserMessagingPingTime","number",120000));
		messageSocketBrowser = win.document.getElementById("message.socket");	
		messageSocketBrowser.addEventListener("DOMContentLoaded", base.messageSocketListener, true);
		messageSocketBrowser.setAttribute("src","chrome://seb/content/message_socket.html"); // to fire window DOMContentLoaded
	},
	
	closeMessageSocket : function() {
		if (base.messageServer) {
			messageSocket.close();
		}
	},
	
	quitFromHost : function () {
		seb.quitIgnoreWarning = true;
		seb.quitIgnorePassord = true;
		seb.allowQuit = true;
		seb.quit();
	},
	
	quitLinuxHost : function() {
		// create an nsIFile for the executable
		try {
			var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
			file.initWithPath("/usr/bin/sudo");
			// create an nsIProcess
			var process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
			process.init(file);
			// Run the process.
			// If first param is true, calling thread will be blocked until
			// called process terminates.
			// Second and third params are used to pass command-line arguments
			// to the process.
			var args = ["/sbin/halt"];
			process.run(false, args, args.length);
		}
		catch(e) {
			//prompt.alert(mainWin, "Message from Admin", e);
			su.err("Error " + e);
		}
	},
	
	sendMessage : function (str) {
		//messageSocket.send(str);
		
		if (socketlog && messageSocket != null) {
			try {
				messageSocket.send(str);
			}
			catch(e){};
		}
	}
}
