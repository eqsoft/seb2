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
XPCOMUtils.defineLazyModuleGetter(this,"su","resource://modules/SebUtils.jsm","SebUtils");
XPCOMUtils.defineLazyModuleGetter(this,"sb","resource://modules/SebBrowser.jsm","SebBrowser");

/* ModuleGlobals */
let 	base = null,
	seb = null,
	pos = {
		0 : "left",
		1 : "center",
		2 : "right"
	};
	
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
	mainScreen : {},
	popupScreen : {},
	
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
	
	removeWin : function (win) {
		if (base.getWinType(win) == "main") { // never remove the main window, this must be controlled by the host app 
			return;
		} 
		for (var i=0;i<base.wins.length;i++) {
			if (base.wins[i] === win) {
				//var n = (win.document && win.content) ? getWinType(win) + ": " + win.document.title : " empty document";
				//_debug("remove win from array: " + ;
				sl.debug("windows count: " + base.wins.length);
				sl.debug("remove win from array ...");
				base.wins.splice(i,1);
				sl.debug("windows count: " + base.wins.length);
				break;
			}
		}
	},
	
	removeSecondaryWins : function () {
		let main = null;
		for (var i=0;i<base.wins.length;i++) {
			let win = base.wins[i];
			if (base.getWinType(win) != "main") {
				var n = (win.document && win.content) ? base.getWinType(win) + ": " + win.document.title : " empty document";
				sl.debug("close win from array: " + n);
				win.close();
			} 
			else {
				main = win;
			}
		}
		base.wins = [];
		base.wins.push(main);
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
	},
	
	setMainScreen : function() {
		if (base.mainScreen['initialized']) { return base.mainScreen; }	 
		base.mainScreen['fullsize'] = (seb.config["browserViewMode"] == 0) ? false : true;
		base.mainScreen['width'] = seb.config["mainBrowserWindowWidth"];
		base.mainScreen['height'] = seb.config["mainBrowserWindowHeight"];
		base.mainScreen['position'] = pos[seb.config["mainBrowserWindowPositioning"]];
		if (seb.config["touchOptimized"] == 1) {
			base.mainScreen['width'] = "100%";
			base.mainScreen['height'] = "100%";
		}
		base.mainScreen['initialized'] = true;
		return base.mainScreen;
	},
	
	setPopupScreen : function() {
		if (base.popupScreen['initialized']) { return base.popupScreen; }
		base.popupScreen['fullsize'] = false;
		base.popupScreen['width'] = seb.config["newBrowserWindowByLinkWidth"];
		base.popupScreen['height'] = seb.config["newBrowserWindowByLinkHeight"];
		base.popupScreen['position'] = pos[seb.config["newBrowserWindowByLinkPositioning"]];
		if (seb.config["touchOptimized"] == 1) {
			base.popupScreen['width'] = "100%";
			base.popupScreen['height'] = "100%";
		}
		base.popupScreen['initialized'] = true;
		return base.popupScreen;
	},
	
	setSize : function(win) {
		sl.debug("setSize: " + base.getWinType(win));
		let scr = (base.getWinType(win) == "main") ? base.setMainScreen() : base.setPopupScreen();
		sl.debug("mainScreen: " + JSON.stringify(scr));
		
		let offWidth = win.outerWidth - win.innerWidth;
		let offHeight = win.outerHeight - win.innerHeight;
		sl.debug("offWidth: " + offWidth);
		sl.debug("offHeight: " + offHeight);
		//let offWidth = 0;
		//let offHeight = 0;
		
		let swt = seb.mainWin.screen.width;
		let sht = seb.mainWin.screen.height;
		
		let tb = su.getConfig("showTaskBar","boolean",false);
		sl.debug("showTaskBar:" + tb);
		
		if (tb) {
			let tbh = su.getConfig("taskBarHeight","number",45);
			sht -= tbh;
			sl.debug("showTaskBar: change height to " + sht);
		}
		
		let stp = seb.mainWin.screen.availTop;
		let slt = seb.mainWin.screen.availLeft;
		
		sl.debug("availTop: " + stp);
		sl.debug("availLeft: " + slt);
		let wx = 0;
		let hx = 0;
		if (typeof scr.width == "string" && /^\d+\%$/.test(scr.width)) {
			let w = scr.width.replace("%","");
			wx = (w > 0) ? ((swt / 100) * w) : swt;
		}
		else {
			wx = (scr.width > 0) ? scr.width : swt;
		}
		sl.debug("wx: " + wx);
		
		if (typeof scr.height == "string" && /^\d+\%$/.test(scr.height)) {
			var h = scr.height.replace("%","");
			hx = (h > 0) ? ((sht / 100) * h) : sht;	
		}
		else {
			hx = (scr.height > 0) ? scr.height : sht;
		}
		sl.debug("hx: " + hx);
		
		if (scr.fullsize) { // needs to be resized with offWidth and offHeight browser frames
			sl.debug("fullsize: " + scr.fullsize);
			if (tb) {
				sl.debug("showTaskBar: " + tb);
				win.resizeTo(swt+offWidth,sht+offHeight); // don't know the correct size
				win.setTimeout(function () { this.moveTo(0,0); }, 100);
			}
			else { // test
				sl.debug("fullsize: resize to: " + wx + ":" + hx);
				win.resizeTo(wx,hx);
				win.setTimeout(function () { setPosition(this) }, 100 );
			}
		}
		else {
			sl.debug("no fullsize: resize to: " + wx + ":" + hx);
			win.resizeTo(wx,hx);
			win.setTimeout(function () { setPosition(this) }, 100 );
		}
		
		function setPosition(win) {
			sl.debug("setPosition: " + scr.position);
			switch (scr.position) {
				case "center" :
					win.moveTo(((swt/2)-(wx/2)),stp);
					break;
				case "right" :
					win.moveTo((swt-wx),stp);
					break;
				case "left" :
					win.moveTo(slt,stp);
					break;
				default :
					// do nothing
			}
		}
	},
	
	setTitleBar : function (win) {
		let w = (win) ? win : base.getRecentWin(); 
		w.document.getElementById("sebWindow").setAttribute("hidechrome",!su.getConfig("showTitleBar","boolean",true));
		//x.debug("hidechrome " + w.document.getElementById("sebWindow").getAttribute("hidechrome"));
	}
}
