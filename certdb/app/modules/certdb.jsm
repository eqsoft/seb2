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
this.EXPORTED_SYMBOLS = ["certdb"];

/* Modules */
const 	{ classes: Cc, interfaces: Ci, results: Cr, utils: Cu } = Components,
	{ appinfo } = Cu.import("resource://gre/modules/Services.jsm").Services,
	{ FileUtils } = Cu.import("resource://gre/modules/FileUtils.jsm",{}),
	{ OS } = Cu.import("resource://gre/modules/osfile.jsm");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const	nsIX509CertDB = Ci.nsIX509CertDB,
	nsIX509CertDB2 = Ci.nsIX509CertDB2,
	nsX509CertDB = "@mozilla.org/security/x509certdb;1",
	nsICertTree = Ci.nsICertTree,
	nsCertTree = "@mozilla.org/security/nsCertTree;1";
	
const	CHROME_CERT_MGR = "chrome://pippki/content/certManager.xul",
	PIN_CERTS_FLAG = "pincerts",
	AUTO_LOAD_FLAG = "autoload",
	CERT_DB = "cert8.db",
	KEY_DB = "key3.db",
	SSL_OVERRIDE = "cert_override.txt",
	BUILTIN_OBJECT = "builtin.json",
	BUILTIN_LOCK = "builtin.lock",
	BUILTIN_OBJECT_TOKEN = "Builtin Object Token";
	
let 	base = null,
	crtwin = null,
	crtdoc = null,
	builtin = {},
	initInterval = null,
	initIntervalCount = 0,
	initIntervalTime = 100,
	initIntervalMax = 50,
	console = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService),
	ovs = Cc["@mozilla.org/security/certoverride;1"].getService(Ci.nsICertOverrideService),
	cdb = Cc[nsX509CertDB].getService(nsIX509CertDB),
	pinCerts = false,
	autoLoad = false,
	os = appinfo.OS.toUpperCase(),
	lf = "",
	sep = "/",
	cmdline = null,
	sebDefaultProfile = null,
	frCertMgr = null,
	btnDisableAllCA = null,
	btnActivateAllCA = null;
	

this.certdb =  {
	win : null,
	quitObserver : {
		observe	: function(subject, topic, data) {
			if (topic == "xpcom-shutdown") {
				base.shutdown();
			}
		},
		get observerService() {  
			return Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);  
		},
		register: function() {  
			this.observerService.addObserver(this, "xpcom-shutdown", false);  
			base.log("quitObserver registered");
		},  
		unregister: function()  {  
			this.observerService.removeObserver(this, "xpcom-shutdown");  
		}  
	},
	
	init : function(cl) {
		//this.log("init certdb"+serverTreeView);
		this.log("init certdb");
		cmdline = cl;
		base = this;
		initCount = 0;
		pinCerts = cmdline.handleFlag(PIN_CERTS_FLAG, false);
		autoLoad = cmdline.handleFlag(AUTO_LOAD_FLAG, false);
		base.quitObserver.register();
		this.initOS();
		this.getSebProfileDir();
		
		if (pinCerts) {
			base.log("pinCerts: " + pinCerts);
			this.disableBuiltInCerts();
		}
		
		if (autoLoad) {
			this.loadCertsFromFolder();
		}
	},
	
	initOS : function() {
		switch (os) { // line feed for dump messages
			case "WINNT" :
				lf = "\n\r";
				sep = "\\";
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
	},
	
	refreshGUI : function() {
		let builtinLockFile = FileUtils.getFile("ProfD",[BUILTIN_LOCK]);
		btnDisableAllCA.disabled = builtinLockFile.exists();
		btnActivateAllCA.disabled = !builtinLockFile.exists();
		initInterval = base.win.setInterval(base.collapseBuiltinCA,initIntervalTime);
		//base.collapseBuiltinCA(builtinLockFile.exists());
	},
	
	collapseBuiltinCA : function() {
		if ((initIntervalCount < initIntervalMax) && (crtwin.caTreeView.rowCount < 0)) {
			initIntervalCount++;
			base.log(initIntervalCount);
		}
		else {
			let builtinLockFile = FileUtils.getFile("ProfD",[BUILTIN_LOCK]);
			base.log("collapseBuiltinCA");
			base.win.clearInterval(initInterval);
			initIntervalCount = 0;
			var cols = crtdoc.getElementById("ca-tree").columns;
			
			// first open all container to fetch get certs 
			// then analyse if any cert in this container is activated -> close container
			
			for (var i=0;i<crtwin.caTreeView.rowCount;i++) {
				//base.log(i);
				if (crtwin.caTreeView.isContainer(i) && !crtwin.caTreeView.isContainerOpen(i)) {
					//base.log("open container " + i);
					crtwin.caTreeView.toggleOpenState(i);
				}
			}
			
			for (var i=0;i<crtwin.caTreeView.rowCount;i++) {
				if (crtwin.caTreeView.isContainer(i)) {
					var found = false;
					for (var j=i+1;j<=crtwin.caTreeView.rowCount;j++) {
						if (crtwin.caTreeView.isContainer(j)) { // next container or end
							if (!found) {
								crtwin.caTreeView.toggleOpenState(i);
								found = false;
							}
							break;
						}
						
						try {
							var tree_item = crtwin.caTreeView.getTreeItem(j);
							if (tree_item && tree_item.cert) {
								var ssl = cdb.isCertTrusted(tree_item.cert, Ci.nsIX509Cert.CA_CERT, nsIX509CertDB.TRUSTED_SSL);
								var email = cdb.isCertTrusted(tree_item.cert, Ci.nsIX509Cert.CA_CERT, nsIX509CertDB.TRUSTED_EMAIL);
								var objsign = cdb.isCertTrusted(tree_item.cert, Ci.nsIX509Cert.CA_CERT, nsIX509CertDB.TRUSTED_OBJSIGN);
								//base.log(ssl+":"+email+":"+objsign);
								
								if (ssl || email || objsign) {
									base.log("found trusted cert: " + tree_item.cert.subjectName + "\n open parent container" );
									found = true;
									break;
								}
							}
						}
						catch(e) {
							base.log("END of loop");
							if (!found) {
								crtwin.caTreeView.toggleOpenState(i);
								found = false;
							}
							break;
						}
					}
				}
				else {
					continue;
				}
			}
		}
	},

	getSebProfileDir : function() {
		sebDefaultProfile = FileUtils.getFile("CurProcD",[]);
		let sebDefaultProfileArr = sebDefaultProfile.path.split(sep);
		sebDefaultProfileArr.pop();
		sebDefaultProfileArr.pop();
		sebDefaultProfileArr.push("browser");
		sebDefaultProfileArr.push("app");
		sebDefaultProfileArr.push("defaults");
		sebDefaultProfileArr.push("profile");
		sebDefaultProfile = new FileUtils.File(sebDefaultProfileArr.join(sep));
		if (!sebDefaultProfile.exists()) {
			base.log("Error: could not find seb profile folder: " + sebDefaultProfile.path);
			return;
		}
	},
	
	loadCertsFromFolder : function() {
		let caDir = FileUtils.getDir("CurProcD",["certs","ca"]);
		let entries = caDir.directoryEntries; 
		while(entries.hasMoreElements()) {  
			let entry = entries.getNext();
			entry.QueryInterface(Ci.nsIFile);
			if (/^\./.test(entry.leafName)) { // ignore hidden files
				continue;
			} 
			try {
				cdb.importCertsFromFile(null,entry,Ci.nsIX509Cert.CA_CERT);
				let certs = cdb.getCerts();
				let enumerator = certs.getEnumerator();
				while (enumerator.hasMoreElements()) {
					let cert = enumerator.getNext().QueryInterface(Ci.nsIX509Cert);
					base.log("import CA: " + cert.subjectName);
					break;
				}
			}
			catch (e) {
				base.log("Error importing CA File: " + entry.leafName + "\n" + e)
			}
		}
		
		let p12Dir = FileUtils.getDir("CurProcD",["certs","p12"]);
		entries = p12Dir.directoryEntries; 
		while(entries.hasMoreElements()) {  
			let entry = entries.getNext();
			entry.QueryInterface(Ci.nsIFile);
			if (/^\./.test(entry.leafName)) { // ignore hidden files
				continue;
			}
			try {
				cdb.importPKCS12File(null,entry);
				let certs = cdb.getCerts();
				let enumerator = certs.getEnumerator();
				while (enumerator.hasMoreElements()) {
					
					let cert = enumerator.getNext().QueryInterface(Ci.nsIX509Cert);
					
					this.log("import P12: " + cert.subjectName);
					break;
				}
			}
			catch (e) {
				this.log("Error importing p12 File: " + entry.leafName + "\n" + e)
			}
		}
		
		let sslDir = FileUtils.getDir("CurProcD",["certs","ssl"]);
		entries = sslDir.directoryEntries; 
		while(entries.hasMoreElements()) {  
			let entry = entries.getNext();
			entry.QueryInterface(Ci.nsIFile);
			if (/^\./.test(entry.leafName)) { // ignore hidden files
				continue;
			}
			try {
				cdb.importCertsFromFile(null,entry,Ci.nsIX509Cert.SERVER_CERT);
				// pick up the cert
				let certs = cdb.getCerts();
				let enumerator = certs.getEnumerator();
				
				while (enumerator.hasMoreElements()) {
					let cert = enumerator.getNext().QueryInterface(Ci.nsIX509Cert);
					this.addSSLCert(cert,entry.leafName, false);
					break;
				}
				
			}
			catch (e) {
				this.log("Error importing ssl File: " + entry.leafName + "\n" + e)
			}
		}
		
		let sslDebugDir = FileUtils.getDir("CurProcD",["certs","ssl_debug"]);
		entries = sslDebugDir.directoryEntries; 
		while(entries.hasMoreElements()) {  
			let entry = entries.getNext();
			entry.QueryInterface(Ci.nsIFile);
			if (/^\./.test(entry.leafName)) { // ignore hidden files
				continue;
			}
			try {
				cdb.importCertsFromFile(null,entry,Ci.nsIX509Cert.SERVER_CERT);
				// pick up the cert
				let certs = cdb.getCerts();
				let enumerator = certs.getEnumerator();
				
				while (enumerator.hasMoreElements()) {
					let cert = enumerator.getNext().QueryInterface(Ci.nsIX509Cert);
					this.addSSLCert(cert,entry.leafName, true);
					break;
				}
				
			}
			catch (e) {
				this.log("Error importing debug ssl File: " + entry.leafName + "\n" + e)
			}
		}  
	},
	
	addSSLCert : function(cert,filename,debug) {
		try {
			let flags = (debug) ? ovs.ERROR_UNTRUSTED | ovs.ERROR_MISMATCH | ovs.ERROR_TIME : ovs.ERROR_UNTRUSTED;
			let host = "";
			let port = 443;
			
			let fullhost = filename.split(".");
			fullhost.pop(); // delete file extension
			
			if (fullhost[fullhost.length-1].match(/\d+/)) {
				port = fullhost.pop();
			}
			host = fullhost.join(".");
			
			ovs.rememberValidityOverride(host,port,cert,flags,false);
			this.log("add ssl cert: " + host + ":" + port);
		}
		catch (e) { this.log(e); }
	},
	
	disableBuiltInCerts : function () {
		base.log("disableBuiltInCerts");
		let certs = cdb.getCerts();
		let enumerator = certs.getEnumerator();
		while (enumerator.hasMoreElements()) {
			let cert = enumerator.getNext().QueryInterface(Ci.nsIX509Cert);
			if (base.isBuiltinToken(cert)) {
				base.log(cert.subjectName);
				//cdb.setCertTrust(cert, Ci.nsIX509Cert.CA_CERT, Ci.nsIX509Cert.CERT_NOT_TRUSTED);
				cdb.setCertTrust(cert, Ci.nsIX509Cert.CA_CERT, Ci.nsIX509CertDB.UNTRUSTED);
				//base.log("disable: " + cert.subjectName);
			}
		}
		// set lockFile = FileUtils 
		base.setBuiltinLock(base.refreshGUI);
	},
	
	activateBuiltInCerts : function () {
		base.log("activateBuiltInCerts");
		Object.keys(builtin).forEach(
			function(key) {
				let trusts = builtin[key];
				let cert = cdb.findCertByDBKey(key,null);
				let trustssl = (trusts.ssl) ? Ci.nsIX509CertDB.TRUSTED_SSL : 0;
				let trustemail = (trusts.email) ? Ci.nsIX509CertDB.TRUSTED_EMAIL : 0;
				let trustobjsign = (trusts.objsign) ? Ci.nsIX509CertDB.TRUSTED_OBJSIGN : 0;
				cdb.setCertTrust(cert, Ci.nsIX509Cert.CA_CERT, trustssl | trustemail | trustobjsign);
			}
		);
		base.removeBuiltinLock(base.refreshGUI);
	},
	
	isBuiltinToken : function(cert) {
		return cert.tokenName == BUILTIN_OBJECT_TOKEN;
	},
	
	setBuiltInCertCache : function () {
		let builtinFile = FileUtils.getFile("ProfD",[BUILTIN_OBJECT]);
		if (builtinFile.exists()) {
			base.log(BUILTIN_OBJECT + " exists, loading object...");
			let path = builtinFile.path;
			let decoder = new TextDecoder();
			let promise = OS.File.read(path);
			promise = promise.then(
				function onSuccess(array) {
					builtin = JSON.parse(decoder.decode(array));
					base.refreshGUI();
				},
				function onError() {
					base.log("error reating: " + path);
				}
			); 
		}
		else {
			base.log(BUILTIN_OBJECT + " not exists, creating object...");
			let certs = cdb.getCerts();
			let enumerator = certs.getEnumerator();
			while (enumerator.hasMoreElements()) {
				let cert = enumerator.getNext().QueryInterface(Ci.nsIX509Cert);
				if (base.isBuiltinToken(cert)) {
					var ssl = cdb.isCertTrusted(cert, Ci.nsIX509Cert.CA_CERT, nsIX509CertDB.TRUSTED_SSL);
					var email = cdb.isCertTrusted(cert, Ci.nsIX509Cert.CA_CERT, nsIX509CertDB.TRUSTED_EMAIL);
					var objsign = cdb.isCertTrusted(cert, Ci.nsIX509Cert.CA_CERT, nsIX509CertDB.TRUSTED_OBJSIGN);
 					builtin[cert.dbKey] = { "ssl" :  ssl, "email" : email, "objsign" : objsign };
				}
			}
			base.saveBuiltin(base.refreshGUI);
		}
		
	},
	
	setBuiltinLock : function(cb) {
		let builtinLockFile = FileUtils.getFile("ProfD",[BUILTIN_LOCK]);
		let path = builtinLockFile.path;
		let promise = OS.File.open(path, { write : true } );
		promise = promise.then(
			function onSuccess(file) {
				base.log("builtin lock file created: " + path);
				file.close();
				cb.call(null);
				//continueInit(file);
			},
			function onError(file) {
				base.log("Error creating builtin lock file: " + path);
				file.close();
				//continueInit();
			}
		);
	},
	
	removeBuiltinLock : function(cb) {
		let builtinLockFile = FileUtils.getFile("ProfD",[BUILTIN_LOCK]);
		if (builtinLockFile.exists()) {
			try {
				builtinLockFile.remove(false);
				base.log("builtin lock file removed: " + builtinLockFile.path);
				cb.call(null);
			}
			catch (e) {
				base.log("error removing: " + builtinLockFile.path);
			}
		}
	},
	
	saveBuiltin : function(cb) {
		let builtinFile = FileUtils.getFile("ProfD",[BUILTIN_OBJECT]);
		let path = builtinFile.path;
		let encoder = new TextEncoder();
		let array = encoder.encode(JSON.stringify(builtin));
		let promise = OS.File.writeAtomic(path, array, { tmpPath: path + '.tmp' } );
		promise = promise.then(
			function onSuccess(file) {
				base.log("builtin file created: " + path);
				cb.call(null);
				//continueInit(file);
			},
			function onError(file) {
				base.log("Error creating builtin file: " + path);
				//file.close();
				//continueInit();
			}
		);
	},
	
	shutdown : function () {
		this.log("shutdown");
		
		let profileDir = FileUtils.getDir("ProfD",[]);
		
		// copy files to seb profile
		/*
		let cert_db = FileUtils.getFile("ProfD",[CERT_DB]);
		let key_db = FileUtils.getFile("ProfD",[KEY_DB]);
		let ssl_override = FileUtils.getFile("ProfD",[SSL_OVERRIDE]);
		
		if (cert_db.exists()) {
			this.log("copy " + CERT_DB + " to seb default profile: " + sebDefaultProfile.path);
			cert_db.copyTo(sebDefaultProfile,CERT_DB);
		}
		else {
			this.log("file does not exist: " + cert_db.path);
		}
		
		if (key_db.exists()) {
			this.log("copy " + KEY_DB + " to seb default profile: " + sebDefaultProfile.path);
			cert_db.copyTo(sebDefaultProfile,KEY_DB);
		}
		else {
			this.log("file does not exist: " + key_db.path);
		}
		
		if (ssl_override.exists()) {
			this.log("copy " + SSL_OVERRIDE + " to seb default profile: " + sebDefaultProfile.path);
			ssl_override.copyTo(sebDefaultProfile,SSL_OVERRIDE);
		}
		else {
			this.log("file does not exist: " + ssl_override.path);
		}
		*/
		/*
		let entries = profileDir.directoryEntries; 
		while(entries.hasMoreElements()) {  
			let entry = entries.getNext();
			entry.QueryInterface(Ci.nsIFile);
			try {
				this.log("remove: " + entry.path);
				entry.remove(true);
			}
			catch (e) {
				this.log("Error removing: " + entry.leafName + "\n" + e);
			}
		}
		*/  
	},
	
	onload : function(win) {
		base.log("onload: " + win);
		base.win = win;
		frCertMgr = win.document.getElementById("frCertMgr");
		frCertMgr.addEventListener("load", base.onIframeLoaded, true);
		frCertMgr.setAttribute("src",CHROME_CERT_MGR);
	},
	
	onunload : function(win) {
		this.log("onunload");
	},
	
	onclose : function(win) {
		this.log("onclose");
	},
	
	onIframeLoaded : function() {
		base.log("iframe loaded: " + frCertMgr.getAttribute("src"));
		btnDisableAllCA = frCertMgr.contentDocument.getElementById("btnDisableAllCA");
		btnActivateAllCA = frCertMgr.contentDocument.getElementById("btnActivateAllCA");
		
		btnDisableAllCA.addEventListener("command",base.disableBuiltInCerts,true);
		btnActivateAllCA.addEventListener("command",base.activateBuiltInCerts,true);
		
		crtwin = frCertMgr.contentWindow;
		crtdoc = frCertMgr.contentDocument;
		base.setBuiltInCertCache();
		//initInterval = base.win.setInterval(base.initViews,initIntervalTime);
	},
	
	onCASelectAll : function() {
		base.log("onCASelectAll");
		let caTreeView = frCertMgr.contentDocument.getElementById("ca-tree").view;
		if (cbxCASelectAll.checked) {
			caTreeView.selection.selectAll();
		}
		else {
			caTreeView.selection.select(1);
		}
	},
	
	log : function(msg) {
		dump(msg + "\n");
		console.logStringMessage(msg);
	}
}
