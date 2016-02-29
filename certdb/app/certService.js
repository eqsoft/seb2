const 	{ classes: Cc, interfaces: Ci, results: Cr, utils: Cu } = Components,
	{ OS } = Cu.import("resource://gre/modules/osfile.jsm");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://modules/certdb.jsm");

var certService = function () {};

certService.prototype = {
	
	classDescription: "certService",
	classID: Components.ID('{2971c315-b871-32cd-b33f-bfee4fcbf683}'),
	contractID: "@mozilla.org/commandlinehandler/profile-after-change;1?type=certService",
	_xpcom_categories: [{
		category: "command-line-handler",
		entry: "m-cert-service"
	}],	
	QueryInterface: XPCOMUtils.generateQI([Ci.nsICommandLineHandler]),
	
	handle : function clh_handle(cmdLine) {		
		try {	
			certdb.init(cmdLine);
			cmdLine.preventDefault = true;
		}
		catch (e) { dump(e+"\n"); }		
	}
};
var NSGetFactory = XPCOMUtils.generateNSGetFactory([certService]);
