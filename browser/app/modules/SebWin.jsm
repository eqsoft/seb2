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

this.EXPORTED_SYMBOLS = ["SebWin"];

/* Modules */
const 	{ classes: Cc, interfaces: Ci, results: Cr, utils: Cu } = Components;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

/* Services */
let 	wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator),
	wpl = Ci.nsIWebProgressListener,
	wnav = Ci.nsIWebNavigation;


/* SebModules */
XPCOMUtils.defineLazyModuleGetter(this,"sl","resource://modules/SebLog.jsm","SebLog");
XPCOMUtils.defineLazyModuleGetter(this,"sb","resource://modules/SebBrowser.jsm","SebBrowser");

/* ModuleGlobals */
let 	base = null,
	seb = null;
	
const	xulFrame = "seb.iframe",
	xulBrowser = "seb.browser",
	xulErr = "chrome://seb/content/err.xul",
	xulLoad	= "chrome://seb/content/load.xul",
	errDeck	= 0,
	loadDeck = 0,
	contentDeck = 1,
	serverDeck = 2,
	messageDeck = 3;
	
this.SebWin = {
	wins : [],
	
	init : function(obj) {
		base = this;
		seb = obj;
		sl.out("SebWin initialized: " + seb);
	},
	
	getWinType : function (win) {
		return win.document.getElementsByTagName("window")[0].getAttribute("windowtype");
	},
	
	setWinType : function (win,type) {
		win.document.getElementsByTagName("window")[0].setAttribute("windowtype",type);
	},
	
	addWin : function (win) {
		if (base.wins.length >= 1) { // secondary
			base.setWinType(win,"secondary");
		}
		sb.initBrowser(win);
		base.wins.push(win);
		sl.debug("window added with type: " + base.getWinType(win) + " - " + win.content.location.href);
		sl.debug("windows count: " + base.wins.length);
	},
	
	getRecentWin : function () {
		return wm.getMostRecentWindow(null);
	},
	
	getChromeWin : function (w) {
		return w.QueryInterface(Ci.nsIInterfaceRequestor)
                   .getInterface(Ci.nsIWebNavigation)
                   .QueryInterface(Ci.nsIDocShellTreeItem)
                   .rootTreeItem
                   .QueryInterface(Ci.nsIInterfaceRequestor)
                   .getInterface(Ci.nsIDOMWindow);
	},
	
	closeAllWin : function() {
		for (var i=base.wins.length-1;i>=0;i--) { // ich nehm Euch alle MIT!!!!
			try {
				sl.debug("close window ...");
				base.wins[i].close();
			}
			catch(e) {
				sl.err(e);
			}
		}
	},
	
	loadPage : function (win,url,loadFlag) {	// only use for real http requests
		sl.debug("try to load: " + url);	
		if (!win.XulLibBrowser) {
			sl.err("no seb.browser in ChromeWindow!");
			return false;
		}
		if (typeof(loadFlag) == "undefined") {
    			loadFlag = wnav.LOAD_FLAGS_BYPASS_HISTORY | wnav.LOAD_FLAGS_BYPASS_CACHE;
		}
		win.XulLibBrowser.webNavigation.loadURI(url, loadFlag, null, null, null);
	},
	
	showLoading : function (win) {
		let w = (win) ? win : base.getRecentWin();
		sl.debug("showLoading...");
		base.getFrameElement(w).setAttribute("src",xulLoad);
		base.setDeckIndex(w,loadDeck);
	},
	
	showContent : function (win,fromkey) { 
		sl.debug("showContent...");
		base.showDeck(win,fromkey,contentDeck);
	},
	
	showServer : function (win,fromkey) { 
		sl.debug("showServer...");
		base.showDeck(win,fromkey,serverDeck);
	},
	
	showMessage : function (win,fromkey) { 
		sl.debug("showMessage...");
		base.showDeck(win,fromkey,messageDeck);
	},
	
	showDeck(win,fromkey,index)  {
		if (fromkey && ! seb.DEBUG) { return; }
		let w = (win) ? win : base.getRecentWin();
		//sl.debug("showContent..." + base.getWinType(w));
		base.setDeckIndex(w,index);
		try {
			w.document.title = w.content.document.title;
		}
		catch(e) {}
		w.focus();
		w.XulLibBrowser.focus();
	},
	
	getDeck : function (win) {
		let w = (win) ? win : base.getRecentWin();
		return w.document.getElementById("deckContents");
	},
	
	getDeckIndex : function (win) {
		let w = (win) ? win : base.getRecentWin();
		return base.getDeck(win).selectedIndex;
	},
	
	setDeckIndex : function (win,index) {
		let w = (win) ? win : base.getRecentWin();
		base.getDeck(win).selectedIndex = index;
	},
	
	getFrameElement : function (win) {
		let w = (win) ? win : base.getRecentWin();
		return w.document.getElementById(xulFrame);
	}
}
