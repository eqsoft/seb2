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
	{ FileUtils } = Cu.import("resource://gre/modules/FileUtils.jsm",{});

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const	nsIX509CertDB = Ci.nsIX509CertDB,
	nsIX509CertDB2 = Ci.nsIX509CertDB2,
	nsX509CertDB = "@mozilla.org/security/x509certdb;1";
	
const	CHROME_CERT_MGR = "chrome://pippki/content/certManager.xul",
	PIN_CERTS_FLAG = "pincerts",
	AUTO_LOAD_FLAG = "autoload",
	CERT_DB = "cert8.db",
	KEY_DB = "key3.db",
	SSL_OVERRIDE = "cert_override.txt";
	
let 	base = null,
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
	cbxCASelectAll = null,
	btnDeleteAllCA = null;

this.certdb =  {
	
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
		this.log("init certdb"+serverTreeView);
		cmdline = cl;
		base = this;
		pinCerts = cmdline.handleFlag(PIN_CERTS_FLAG, false);
		autoLoad = cmdline.handleFlag(AUTO_LOAD_FLAG, false);
		base.quitObserver.register();
		this.initOS();
		this.getSebProfileDir();
		
		if (pinCerts) {
			this.log("pinCerts: " + pinCerts);
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
			this.log("Error: could not find seb profile folder: " + sebDefaultProfile.path);
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
					this.log("import CA: " + cert.subjectName);
					break;
				}
			}
			catch (e) {
				this.log("Error importing CA File: " + entry.leafName + "\n" + e)
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
	
	deleteAllCACerts : function () {
		base.log("delete all CA certs");
		let certs = cdb.getCerts();
		let enumerator = certs.getEnumerator();
		while (enumerator.hasMoreElements()) {
			let cert = enumerator.getNext().QueryInterface(Ci.nsIX509Cert);
			base.log("delete cert: " + cert.subjectName);
			cdb.deleteCertificate(cert);
		}
	},
	
	disableBuiltInCerts : function () {
		let certs = cdb.getCerts();
		let enumerator = certs.getEnumerator();
		while (enumerator.hasMoreElements()) {
			let cert = enumerator.getNext().QueryInterface(Ci.nsIX509Cert);
			cdb.setCertTrust(cert, Ci.nsIX509Cert.CA_CERT, Ci.nsIX509Cert.CERT_NOT_TRUSTED);
			this.log("disable: " + cert.subjectName);
		}
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
		this.log("onload: " + win);
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
		cbxCASelectAll = frCertMgr.contentDocument.getElementById("cbxCASelectAll");
		btnDeleteAllCA = frCertMgr.contentDocument.getElementById("btnDeleteAllCA");
		//base.log(frCertMgr.contentDocument.getElementById("cbxCASelectAll"));
		cbxCASelectAll.addEventListener("click",base.onCASelectAll,true);
		btnDeleteAllCA.addEventListener("click",base.deleteAllCACerts,true);
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
