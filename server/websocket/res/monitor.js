(function( $ ) {	
	var prot;
	var sock_url; 
	var ws;
		
	function init(config) {
		prot = (window.location.protocol === "https:") ? "wss:" : "ws:"; // for ssl
		sock_url = prot + "//" + window.location.host; 
		ws = new WebSocket(sock_url);
		console.log("debug: " + config.debug);
		console.log("websocket: " + ws);
	} 
	
	var methods = {
		init 		: init
	}
	
	$.fn.sebadmin = function ( method ) {
		// Method calling logic
		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} 
		else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} 
		else {
			console.error( 'Method ' +  method + ' does not exist on jQuery.sebadmin' );
		} 
	};
})(jQuery);

$(document).ready( function() {
	//$('#clients').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="clientsData"></table>' ); 
	$(this).sebadmin({ debug : true }); 
});
