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

this.EXPORTED_SYMBOLS = ["SebBrowser"];

/* Modules */
const 	{ classes: Cc, interfaces: Ci, results: Cr, utils: Cu } = Components,
	{ prompt, scriptloader } = Cu.import("resource://gre/modules/Services.jsm").Services;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

/* Services */
let	wpl = Ci.nsIWebProgressListener,
	wnav = Ci.nsIWebNavigation,
	ovs = Cc["@mozilla.org/security/certoverride;1"].getService(Ci.nsICertOverrideService);
	

/* SebGlobals */
scriptloader.loadSubScript("resource://globals/prototypes.js");

/* SebModules */
XPCOMUtils.defineLazyModuleGetter(this,"su","resource://modules/SebUtils.jsm","SebUtils");
XPCOMUtils.defineLazyModuleGetter(this,"sl","resource://modules/SebLog.jsm","SebLog");
XPCOMUtils.defineLazyModuleGetter(this,"sw","resource://modules/SebWin.jsm","SebWin");
XPCOMUtils.defineLazyModuleGetter(this,"sn","resource://modules/SebNet.jsm","SebNet");
XPCOMUtils.defineLazyModuleGetter(this,"sh","resource://modules/SebHost.jsm","SebHost");
XPCOMUtils.defineLazyModuleGetter(this,"sc","resource://modules/SebScreenshot.jsm","SebScreenshot");

/* ModuleGlobals */
let 	base = null,
	seb = null,
	certdb = null,
	loadFlag = null,
	pdfViewer = "chrome://pdfjs/content/web/viewer.html?file=",
	pdfViewerName = "sebPdfViewer";
	
const	nsIX509CertDB = Ci.nsIX509CertDB,
	nsX509CertDB = "@mozilla.org/security/x509certdb;1";

function nsBrowserStatusHandler() {};
nsBrowserStatusHandler.prototype = { // override functions with addBrowserXXXListener
	onStateChange : function(aWebProgress, aRequest, aStateFlags, aStatus) {},
	onStatusChange : function(aWebProgress, aRequest, aStatus, aMessage) {},
	onProgressChange : function(aWebProgress, aRequest, aCurSelfProgress,
							  aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress) {
	},
	onSecurityChange : function(aWebProgress, aRequest, state) {
	},
	onLocationChange : function(aWebProgress, aRequest, aLocation) {
	},
	QueryInterface : function(aIID) {
			if (aIID.equals(Ci.nsIWebProgressListener) ||
			aIID.equals(Ci.nsISupportsWeakReference) ||
			aIID.equals(Ci.nsIXULBrowserWindow) ||
			aIID.equals(Ci.nsISupports)) {
			return this;
		}
		throw Cr.NS_NOINTERFACE;
	},
	setJSStatus : function(status) {},  
	setJSDefaultStatus : function(status) {},
	setOverLink : function(link) {}
}

let base = null;

this.SebBrowser = {
	init : function(obj) {
		base = this;
		seb = obj;
		certdb = Cc[nsX509CertDB].getService(nsIX509CertDB);
		sl.out("SebBrowser initialized: " + seb);
	},
	
	browserStateListener : function(aWebProgress, aRequest, aStateFlags, aStatus) {
		if(aStateFlags & wpl.STATE_IS_NETWORK) {
			if (aStateFlags & wpl.STATE_STOP) {
				let win = sw.getChromeWin(aWebProgress.DOMWindow);
				//let win2 = win.QueryInterface(Ci.nsIWebBrowserChrome);
				//sl.out(win2.chromeFlags);
				var w = aWebProgress.DOMWindow.wrappedJSObject;
				if (win === seb.mainWin && su.getConfig("sebScreenshot","boolean",false)) {
					sc.createScreenshotController(w);
				}
				if (su.getConfig("browserScreenKeyboard","boolean",false)) {
					sh.createScreenKeyboardController(win);
				}
				/*
				if (su.getConfig("sebPdfJsEnabled","boolean", true)) {
					sl.debug("registerContentHandler: application/pdf");
					w.navigator.registerContentHandler(
						"application/pdf",
						"http://www.heise.de",
						"PDFJS");
				}
				*/ 
				sw.showContent(win);
			}
			if (aStateFlags & wpl.STATE_START) {
				//sl.out("sdfsdfsdf");
				//let win = sw.getChromeWin(aWebProgress.DOMWindow);
				//sl.debug(win);											
				try {
					if (seb.quitURL === aRequest.name) {
						aRequest.cancel(aStatus);
						var tmpQuit = seb.allowQuit; // store default shutdownEnabled
						var tmpIgnorePassword = seb.quitIgnorePassword; // store default quitIgnorePassword
						seb.allowQuit = true; // set to true
						seb.quitIgnorePassword = true;
						seb.quit();									
						seb.allowQuit = tmpQuit; // set default shutdownEnabled
						seb.quitIgnorePassword = tmpIgnorePassword; // set default shutdownIgnorePassword
						return;
					}
					if (aRequest && aRequest.name) {
						let win = sw.getChromeWin(aWebProgress.DOMWindow);
						//sl.debug("KHKJHKJHK:"+win.content.location.href);
						if (!sn.isValidUrl(aRequest.name)) {
							aRequest.cancel(aStatus);
							prompt.alert(seb.mainWin, su.getLocStr("seb.title"), su.getLocStr("seb.url.blocked"));
							return 1; // 0?
						}
						// don't trigger if pdf is part of the query string: infinite loop
						// don't trigger from pdfViewer itself: infinite loop
						if (/^[^\?]+\.pdf$/i.test(aRequest.name) && !/^chrome\:\/\/pdfjs/.test(aRequest.name)) {
							sl.debug("catch pdf request");
							aRequest.cancel(aStatus);
							sw.openDistinctWin(pdfViewer+aRequest.name);
							return 1;
						}			
					}				
				}
				catch(e) {
					sl.err(e);
					return 0;
				}
			}
			return 0;
		}
	},
	
	getBrowser : function (win) {
		try { return win.document.getElementById("seb.browser"); }
		catch(e) { sl.err(e) }
	},
	
	setBrowserHandler : function setBrowserHandler(win) { // Event handler for both wintypes
		sl.debug("setBrowserHandler");
		base.addBrowserStateListener(win,base.browserStateListener); // for both types
	},
	
	initBrowser : function (win) {
		if (!win) {
			sl.err("wrong arguments for initBrowser(win)");
			return false;
		}
		var br = base.getBrowser(win);
		
		if (!br) {
			sl.debug("no seb.browser in ChromeWindow!");
			return false;
		}	
		win.XulLibBrowser = br; // extend window property to avoid multiple getBrowser() calls
		win.XULBrowserWindow = new nsBrowserStatusHandler();
		// hook up UI through progress listener
		var interfaceRequestor = win.XulLibBrowser.docShell.QueryInterface(Ci.nsIInterfaceRequestor);
		var webProgress = interfaceRequestor.getInterface(Ci.nsIWebProgress);
		webProgress.addProgressListener(win.XULBrowserWindow, Ci.nsIWebProgress.NOTIFY_ALL);
		sl.debug("initBrowser");
	},
	
	addBrowserStateListener : function (win,listener) {
		if (!win.XulLibBrowser) {
			sl.err("no win.browser in ChromeWindow!");
			return false;
		}
		win.XULBrowserWindow.onStateChange = listener;
	},

	addBrowserStatusListener : function (win,listener) {
		if (!win.XulLibBrowser) {
			sl.err("no xullib.browser in ChromeWindow!");
			return false;
		}
		win.XULBrowserWindow.onStatusChange = listener;
	},
	
	addCert : function(cert) {
		try {
			let flags = ovs.ERROR_UNTRUSTED | ovs.ERROR_MISMATCH | ovs.ERROR_TIME;
			let x509 = certdb.constructX509FromBase64(cert.certificateData);
			//certlist.addCert(x509); // maybe needed for type 1 Identity Certs
			let host = cert.name;
			let port = 443;
			let fullhost = cert.name.split(":");
			if (fullhost.length==2) {
				host = fullhost[0];
				port = parseInt(fullhost[1]);
			}
			ovs.rememberValidityOverride(host,port,x509,flags,true);
			sl.debug("add cert: " + host + ":" + port + "\n" + cert.certificateData);
		}
		catch (e) { sl.err(e); s}
	},
	
	setEmbeddedCerts : function() {
		let certs = seb.config["embeddedCertificates"];
		if ( typeof certs != "object") { return; }
		sl.debug("setEmbeddedCerts");
		for (var i=0;i<certs.length;i++) {
			base.addCert(certs[i]);
		}
	},
	
	loadPage : function (win,url,flag) {	// only use for real http requests
		sl.debug("try to load: " + url);
		if (loadFlag === null) {
			if (su.getConfig("mainBrowserBypassCache","boolean",false)) {
				loadFlag |= wnav.LOAD_FLAGS_BYPASS_CACHE;
			}
			if (!su.getConfig("allowBrowsingBackForward","boolean",false)) {
				loadFlag |= wnav.LOAD_FLAGS_BYPASS_HISTORY;
			}
		}
		
		let f = (flag === "undefined") ? loadFlag : flag; 
		if (!win.XulLibBrowser) {
			sl.err("no seb.browser in ChromeWindow!");
			return false;
		}
		if (typeof flag == "undefined") {
    			flag = loadFlag;
		}
		win.XulLibBrowser.webNavigation.loadURI(url, f, null, null, null);
	},
	
	reload : function (win) {
		sl.debug("try reload...");
		if (!win.XulLibBrowser) {
			sl.err("no xullib.browser in ChromeWindow!");
			return false;
		}
		win.XulLibBrowser.webNavigation.reload(wnav.LOAD_FLAGS_BYPASS_CACHE);
	},
	
	restart : function() {
		if (!su.getConfig("mainBrowserRestart","boolean",true)) {
			sl.debug("restart not allowed.");
			return;
		}
		sl.debug("restart...");
		sw.removeSecondaryWins();
		let url = su.getUrl();
		sw.showLoading(seb.mainWin);
		base.loadPage(seb.mainWin,url);
	},
	
	load : function() {
		//mainBrowserLoad
		//mainBrowserLoadReferrer
		sl.debug("try to load from command...");
		let loadUrl = su.getConfig("mainBrowserLoad","string","");
		let loadReferrerInString = su.getConfig("mainBrowserLoadReferrerInString","string","");
		if (loadUrl == "") {
			sl.debug("no mainBrowserLoad defined.");
			return;
		}
		let doc = seb.mainWin.content.document;
		let loadReferrer = doc.location.href;
		if (loadReferrerInString != "") {
			if (loadReferrer.indexOf(loadReferrerInString) > -1) {
				base.loadPage(seb.mainWin,loadUrl);
				// ? warum hab ich das so gemacht:
				/*
				if (isValidUrl(url)) {
					x.debug("load from command " + url);
					doc.location.href = url;
				}
				else {
					prompt.alert(mainWin, getLocStr("seb.title"), getLocStr("seb.url.blocked"));
				}
				return false;
				*/
			}
			else {
					
				sl.debug("loading \"" + loadUrl + "\" is only allowed if string in referrer: \"" + loadReferrerInString + "\"");
				return false;
				 
			}
		}
		else {
			sl.debug("load from command " + loadUrl);
			base.loadPage(seb.mainWin,loadUrl);
			// ? warum hab ich das so gemacht:
			//doc.location.href = url;
		}
	},
	
	back : function(win) {
		if (!su.getConfig("allowBrowsingBackForward","boolean",false)) { 
			sl.debug("navigation: back not allowed")
			return; 
		}
		sl.debug("navigation: back");	
		if (!win.XulLibBrowser) {
			sl.err("no xullib.browser in ChromeWindow!");
			return false;
		}
		win.XulLibBrowser.webNavigation.goBack();
	},
	
	forward : function(win) {
		if (!su.getConfig("allowBrowsingBackForward","boolean",false)) { 
			sl.debug("navigation: forward not allowed");	
			return; 
		}
		sl.debug("navigation: forward");	
		if (!win.XulLibBrowser) {
			sl.err("no xullib.browser in ChromeWindow!");
			return false;
		}
		win.XulLibBrowser.webNavigation.goForward();
	} 
}
