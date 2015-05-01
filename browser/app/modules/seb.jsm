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
this.EXPORTED_SYMBOLS = ["seb"];

/* Modules */
const 	{ classes: Cc, interfaces: Ci, results: Cr, utils: Cu } = Components,
	{ appinfo, io, locale, prefs } = Cu.import("resource://gre/modules/Services.jsm").Services,
	{ FileUtils } = Cu.import("resource://gre/modules/FileUtils.jsm",{}),
	{ OS } = Cu.import("resource://gre/modules/osfile.jsm");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

/* Services */

/* SebModules */
XPCOMUtils.defineLazyModuleGetter(this,"su","resource://modules/SebUtils.jsm","SebUtils");
XPCOMUtils.defineLazyModuleGetter(this,"sl","resource://modules/SebLog.jsm","SebLog");
XPCOMUtils.defineLazyModuleGetter(this,"sw","resource://modules/SebWin.jsm","SebWin");
XPCOMUtils.defineLazyModuleGetter(this,"sb","resource://modules/SebBrowser.jsm","SebBrowser");
XPCOMUtils.defineLazyModuleGetter(this,"sn","resource://modules/SebNet.jsm","SebNet");

/* ModuleGlobals */
let	base = null;

this.seb =  {
	DEBUG : false,
	cmdline : null,
	config	: null,
	mainWin : null,
	profile: {},
	locs : null,	
	consts : null,
	
	toString : function() {
		return appinfo.name;
	},
	
	shutdownObserver : {
		observe	: function(subject, topic, data) {
			if (topic == "xpcom-shutdown") {
				if (base.config["removeProfile"]) {
					sl.debug("removeProfile");
					for (var i=0;i<base.profile.dirs.length;i++) { // don't delete data folder
						sl.debug("try to remove everything from profile folder: " + base.profile.dirs[i].path);
						let entries = base.profile.dirs[i].directoryEntries;
						while(entries.hasMoreElements()) {  
							let entry = entries.getNext();  
							entry.QueryInterface(Ci.nsIFile);
							try {
								sl.debug("remove: " + entry.path);
								entry.remove(true);
							}
							catch(e) { sl.err(e); }
						}
					}
				}
			}	  
		},
		get observerService() {  
			return Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);  
		},
		register: function() {  
			this.observerService.addObserver(this, "xpcom-shutdown", false);  
			sl.debug("shutdownObserver registered");
		},  
		unregister: function()  {  
			this.observerService.removeObserver(this, "xpcom-shutdown");  
		}  
	},
	
	initCmdLine : function(cl) {
		base = this;
		base.cmdline = cl;
		su.init(base);
		base.DEBUG = su.getBool(su.getCmd("debug"));
		sl.init(base); 
		base.initProfile();
		sw.init(base);
		sb.init(base);
		base.initDebug();
		base.initConfig();
	},
	
	initDebug : function() {
		let prefFile = (base.DEBUG) ? FileUtils.getFile("CurProcD",["debug_prefs.js"], null) : FileUtils.getFile("CurProcD",["debug_reset prefs.js"], null);
		if (prefFile.exists()) {
			sl.debug("found " + prefFile.path);
			try { prefs.readUserPrefs(prefFile); }
			catch (e) { sl.err(e); }
		}
		else { sl.err("could not find: " + prefFile.path); }
	},
	
	initConfig : function () {
		// default config file. ToDo configpath via cmdline and base64
		function cb(obj) {
			if (typeof obj == "object") {
				sl.debug("config object found");
				base.config = obj;
				if (typeof base.config.browserPrefs == "object") {
					su.setPrefs(base.config.browserPrefs);
				}
				base.initLocale();
				sn.init(base); // needs config on init for compiled RegEx
			}
		}
		let configParam = su.getCmd("config");
		let configFile = FileUtils.getFile("CurProcD",["config.json"], null);
		if (configParam != null) {
			sl.debug("config param found: " + configParam);
			su.getJSON(configParam.trim(), cb); 
		}
		else {
			if (configFile.exists()) { 
				su.getJSON(configFile.path.trim(),cb); 
			}
			else { 
				sl.err("no config param and no default config.json!");
			}
		}
	},
	
	initProfile : function() {
		try {
			base.profile["dirs"] = [];
			let profilePath = OS.Constants.Path.profileDir;
			let profileDir = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
			let defaultProfile = FileUtils.getDir("CurProcD",["defaults","profile"],null); // see http://mxr.mozilla.org/mozilla-central/source/xpcom/io/nsAppDirectoryServiceDefs.h
			profileDir.initWithPath(profilePath);
			sl.debug("push profile: " + profilePath);
			base.profile["dirs"].push(profileDir);
			// push AppData Local profile directory
			if (appinfo.OS == "WINNT") {
				let localProfilePath = profilePath.replace(/AppData\\Roaming/,"AppData\\Local"); // WIN7 o.k, XP?
				if (localProfilePath) {
					let localProfileDir = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
					localProfileDir.initWithPath(localProfilePath);
					if (localProfileDir.exists()) {
						sl.debug("push local profile: " + localProfilePath);
						base.profile["dirs"].push(localProfileDir);
					}
				}
			}
			if (defaultProfile.exists()) {
				let entries = defaultProfile.directoryEntries; 
				base.profile["customFiles"] = [];
				while(entries.hasMoreElements()) {  
					let entry = entries.getNext();  
					entry.QueryInterface(Components.interfaces.nsIFile);
					// don't copy .svn
					if (/^\..*/.test(entry.leafName)) { // no hidden files like .svn .DS_Store
						continue;
					}
					var cf = base.profile.dirs[0].clone();
					cf.append(entry.leafName);
					base.profile.customFiles.push(cf);
					if (cf.exists()) {
						cf.remove(true);
						sl.debug("delete existing " + cf.path);
					}
					entry.copyTo(base.profile.dirs[0],entry.leafName);
					sl.debug("copy " + entry.leafName + " to " + base.profile.dirs[0].path);														
				}
			}
			else {
				sl.debug("no default profile: " + defaultProfile.path);
			}		
		}
		catch (e) { sl.err(e); return false; }
	},
	
	initLocale : function() {
		let loc = "en-US";
		let osLoc = locale.getLocaleComponentForUserAgent();
		if (osLoc != "") {
			loc = osLoc;
		}
		let paramLoc = base.config["browserLanguage"];
		if (paramLoc != null && paramLoc != "") {
			loc = paramLoc;
		}
		let cmdLoc = su.getCmd("language");
		if (cmdLoc != null && cmdLoc != "") {
			loc = cmdLoc;
		}
		sl.debug("locale: " + loc);
		prefs.setCharPref("general.useragent.locale",loc);
	},
	
	initMain : function(win) {
		sl.debug("initMain");
		url = su.getUrl();
		sb.setEmbeddedCerts();
		base.setShutdownHandler(win);
		sn.httpRequestObserver.register();
		base.locs = win.document.getElementById("locale");	
		base.consts = win.document.getElementById("const");
		sw.showLoading(win);
		sw.loadPage(win,url);
	},
	
	/* handler */
	setShutdownHandler : function(win) {
		sl.debug("setShutdownHandler");
		win.addEventListener( "close", base.shutdown, true); // controlled shutdown for main window
		base.shutdownObserver.register();
	},
	
	/* events */
	onload : function (win) {
		sl.debug("onload");
		sw.addWin(win);
		sb.setBrowserHandler(win);
		if (sw.getWinType(win) == "main") {
			mainWin = win;
			base.initMain(win);
		}
	},
	
	onunload : function(win) {
		sl.debug("onunload");
	},
	
	onclose : function (win) {
		sl.debug("onclose");
	},
	
	shutdown: function() {
		sl.debug("try shutdown");		
	}
}
