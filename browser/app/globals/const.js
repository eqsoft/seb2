const 	DEBUG_LEVEL = 1,
	INFO_LEVEL = 2,
	SSL_SEC_NONE = 0, 		// allow all http / https and mixed contents
	SSL_SEC_BLOCK_MIXED_ACTIVE = 1,	// default: block mixed active contents (scripts...), display contents are allowed (img, css...) = firefox default behaviour
	SSL_SEC_BLOCK_MIXED_ALL = 2,	// block all mixed contents
	SSL_SEC_FORCE_HTTPS = 3,	// try redirecting http to https. Beware! this is not a common browser behaviour! The web app should be fixed instead of rewriting the request on the client side!
	SSL_SEC_BLOCK_HTTP = 4,		// block all http requests
	SEB_FILE_HEADER = 'X-Seb-File', // Seb File Request-Header from sebProtocolHandler
	SEB_MIME_TYPE = 'application/seb',
	LITTLE_ENDIAN = 0,
	BIG_ENDIAN = 1,
	HIDDEN_URL= "chrome://seb/content/hidden.xul",
	HIDDEN_FEATURES = "chrome,modal=no,dialog,resizable=no,width=1,height=1",
	RECONF_NO = 0,
	RECONF_START = 1,
	RECONF_SUCCESS = 2,
	RECONF_ABORTED = 3,
	RECONFIG_URL = "chrome://seb/content/reconf.xul",
	RECONFIG_FEATURES = "chrome,dialog,modal,resizable=yes,width=800,height=600,scrollbars=yes",
	USER_AGENT_REPLACE = 0,
	USER_AGENT_APPEND = 1,
	USER_AGENT_PREPEND = 2;
