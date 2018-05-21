base.testRun = {
	// startDelay intervall: 1-10 seconds randomised
	startDelay : (Math.floor(Math.random() * 8) + 1)*1000,

	// default delay of test execution
	executeDelay : 2000,

	tests : [],

	init : function() {
		// assign test functions to stack tests[], don't forget!!!
		this.tests = [
			this.test1,
			this.test2,
			this.test3
		];
	},
	
	test1 : function (doc) {
		sl.debug('test run: test1');
		let google = doc.querySelector('a[href="http://www.google.de"]');
		google.click();
	},

	test2 : function (doc) {
		sl.debug('test run: test2');
		let input = doc.querySelector('#lst-ib');
		input.value = "What is selenium?";
		input.focus();
		base.clickReturn(doc, input);
	},

	test3 : function (doc) {
		sl.debug('test run: start page');
		base.restart();
	}
}


