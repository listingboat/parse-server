///
/// A very simple Loggly client for Parse.com cloudcode.
/// Usage:
///     logger = require('cloud/libs/logger');
///		logger.setToken('your-loggly-token', 'appname'); // Appname is optional.
///
///     logger.log("A String to Log", {'key': 'Extra fields to add to loggly entry'});
///	           /// The logger will add a few fields replicating the iOS client fields to help filtering and setting up a grid view on Loggly.
///
///     logger.setConsoleLogging(false);		// Stop the logger exhoing to Parse's console.
///
///
/// Notes: The logger assumes that Parse.com honour Node's feature that imports are cached so calling import from one
///        module returns the same module.exports as a previous call to that module.
///        if you start seeing 'not-set' in your URLs either you haven't ever called setToken or Parse are not honouring this promise and
///        you will need to call set token wheever you import logger.
///

var DEBUG = false;

var logger = (function(){
	var LOGGLY_PROTOCOL = 'https',
	LOGGLY_API_DOMAIN = 'logs-01.loggly.com',
	LOGGLY_URL_PREFIX = '/inputs/',
	LOGGLY_INPUT_SUFFIX = '/tag/http/';

	// Rely on Parse.com using node module caching to not duplicate this stuff.
	var logglyToken = 'not-set';
	var urlSet = false;
	var logglyURL;
	var appName = "CloudCode";
	var alsoLogToConsole = true;

	console.log("setting up logger");

	function setupURL(){
		logglyURL = LOGGLY_PROTOCOL + '://' + LOGGLY_API_DOMAIN +  LOGGLY_URL_PREFIX  + logglyToken + LOGGLY_INPUT_SUFFIX
		urlSet = true;
	}

	// Return from the clouse executed as main entry point to this module.
	// effectively the 'public' methods for this 'singleton'
	return {
		setToken: function (token, newAppName){
			console.log("Setting Loggly token to " + token);

			logglyToken = token;
			appName = newAppName;
			urlSet = false;
		},

		setConsoleLogging: function (shouldLog){
			alsoLogToConsole = shouldLog;
		},

		log: function(logString, extraLogData){
			if(!urlSet)
				setupURL();

			var date = new Date();

			// Build the body to send to Loggly
			var body;
			if(typeof(logString) === 'string') {

				if(alsoLogToConsole)
					console.log(logString);

				var date = new Date();
				body = {'rawlogmessage' : logString,
						'devicename' : 'cloudcode',
						'appname': appName,
						'timestamp' : date
				};
				if(typeof (extraLogData) !== 'undefined' ) {
					for (var attribute in extraLogData) {
						obj1[attribute] = extraLogData[attribute];
					}
				}
			}
			else {
				// We have an object as our first paramater so simply send that
				// without any extra adornment

				if(alsoLogToConsole)
					console.log(JSON.stringify(logString));
				body = logString;
			}

			if(DEBUG)
				console.log("logging " + JSON.stringify(body) + " to : " + logglyURL);

			Parse.Cloud.httpRequest({
				'method': 'POST',
				'url': logglyURL,
				'headers': {
					'Content-Type': 'application/json'
				},
				'body': body,
				success: function(response) {
					if(DEBUG)
						console.log('successfully logged: ' + response.text)
				},
				error: function(httpResponse) {
					if(DEBUG)
						console.log('Loggly request failed with response code ' + httpResponse.status + ' url was ' + logglyURL)
				}
			});
		}
	}

})();	// Trailing () causes the closure to execute. We export the return object.

module.exports = logger;
