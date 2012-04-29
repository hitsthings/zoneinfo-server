var express = require('express');

var conf = require('./conf');

var timezoneJSparser = require('./timezone-js/preparse');
var timezoneJS = require('./timezone-js/timezone-js');

var oneWeek = 60 * 60 * 24 * 7;
function addCachingHeaders(req, res, next) {
	res.header('Cache-Control', 'public, max-age=' + oneWeek);
	next();
}

function allowCORS(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	next();
}

function handleNonJSON(req, res, next) {
	if (!req.accepts('json') && !req.accepts('javascript')) {
		res.send('This service only returns JSON (or JSONP when you add a ?callback={callback_name} parameter). Please use the header "Accept: application/json" ot "Accept: text/javascript"');
	} else {
		res.contentType(req.accepts('json') ? 'application/json' : 'text/javascript');
		next();
	}
}

function handleGetTzInfo(req, res, next) {
	var zones = req.param('zone') || [];
	if (typeof zones === 'string') zones = [ zones ];

	if (zones.length) {
		timezoneJSparser.processFileset(zones, conf.dataDir, conf.dataEncoding, function(err, data) {
			if (err) next(err);
			else res.send(data);
		});

	} else next();
}


var zones;
function handleListZones(req, res, next) {

	timezoneJSparser.ensureFilesLoadedSync(conf.dataDir, conf.dataEncoding);

	if (!zones) {
		zones = [];
		for(var zone in timezoneJS.timezone.zones) {
			zones.push(zone);
		}
	}

	res.send({ zones : zones });

}

exports.createApp = function() {

	var app = express.createServer(express.logger());

	conf.configure(app);

	app.get('/', function(req, res) {
		res.contentType("text/html");
		res.send('<!DOCTYPE html>\n<title>Zoneinfo Server</title>' +
			'<p>This site serves <a href="http://en.wikipedia.org/wiki/Tz_database">Olson</a> timezone information from <a href="http://www.iana.org/time-zones">IANA</a></p>' +
			'<p>It has two JSON (via CORS) and JSONP endpoints. Add a ?callback=fn_name param to get a JSONP response.</p>' +
			'<ul>' +
				'<li>Use <a href="./zones">/zones</a> to see the list of zones you can obtain timezone info for.</li>' +
				'<li>Use <a href="./tzinfo?zone=America/Chicago&zone=America/New_York&callback=fn_name">/tzinfo[?zone=X[&zone=Y[&callback=fn_name]]]</a> to get timezone info you can use with <a href="https://github.com/mde/timezone-js">timezone-js</a> (or however you like).</li>' +
			'</ul>' +
			'<p><a href="./demo">Demo</a></p>' +
			'<p>Source on <a href="https://github.com/hitsthings/zoneinfo-server">GitHub</a>.</p>' +
			'<p>Made with JS, love, and <a href="http://noiregrets.com">noir egrets</a> by <a href="http://www.twitter.com/hitsthings">@hitsthings</a>.</p>');
	});

	app.get('/tzinfo', allowCORS, handleNonJSON, addCachingHeaders, handleGetTzInfo, function(request, response) {
	  response.send('To use this service, specify locations using query string parameters. E.g., /tzinfo?zone=America/Chicago&zone=America/New_York');
	});

	app.get('/zones',  allowCORS, handleNonJSON, addCachingHeaders, handleListZones);

	app.get('/demo', function(req, res) {
		res.send('<!DOCTYPE html>\n' +
			'<head>' +
				'<title>Demo page</title>' +
				'<script src="http://code.jquery.com/jquery-1.7.2.min.js"></script>' +
				'<script src="https://raw.github.com/mde/timezone-js/51db759d249a23662bf2c3c7cc7fed4a8662580a/src/date.js"></script>' +
				'<style>script { display: block; white-space: pre; }</style>' +
			'</head>' +
			'<body>' +
				'<div id="clock">Loading clock...</div>' +
				'<script>' + demo.toString() + '\ndemo();</script>' +
			'</body>');
	});

	return app;
};


//client-side JS
function demo() {

	function setupTimezoneJS() {
		// timezone-js needs to remove it's dependency on Fleegix...
		fleegix.xhr = {
			doGet : function(success, url) { $.ajax(url, { processData: false, async: false }).done(function(data) { success(JSON.stringify(data)); }); }
		};

		var _tz = timezoneJS.timezone;
		_tz.loadingScheme = _tz.loadingSchemes.MANUAL_LOAD;
		_tz.zoneFileBasePath = 'stop hassling me';

		// add a method for converting between timezones. Don't trust it - probably buggy.
		timezoneJS.Date.prototype.inTimezone = function(tz) {
			var date = new timezoneJS.Date();
			var self = this;

			date.setTimezone(tz);
			function pipe(type) { date['setUTC' + type](self['getUTC' + type]()); }

			['Milliseconds', 'Seconds', 'Minutes', 'Hours', 'Date', 'Month', 'FullYear'].forEach(pipe);

			return date;
		};
	}
	setupTimezoneJS();
	
	// USAGE: load timezone information for LA, NYC, Sydney, and Tokyo.
	timezoneJS.timezone.loadZoneJSONData('./tzinfo?zone=America/Los_Angeles&zone=America/New_York&zone=Australia/Sydney&zone=Asia/Tokyo');
	
	function displayIntlClock() {
		var clock = document.getElementById('clock');

		function getTimes() {
			var now = new timezoneJS.Date(),
			nowLA = now.inTimezone('America/Los_Angeles'),
			nowNY = now.inTimezone('America/New_York'),
			nowSyd = now.inTimezone('Australia/Sydney'),
			nowTokyo = now.inTimezone('Asia/Tokyo');

			clock.innerHTML = '<dl>' +
					'<dt>You</dt><dd>' + now.toString() + '</dd>' +
					'<dt>Los Angeles</dt><dd>' + nowLA.toString() + '</dd>' +
					'<dt>New York</dt><dd>' + nowNY.toString() + '</dd>' +
					'<dt>Sydney</dt><dd>' + nowSyd.toString() + '</dd>' +
					'<dt>Tokyo</dt><dd>' + nowTokyo.toString() + '</dd>' +
				'</dl>';
		}
		
		setInterval(getTimes, 1000);
	}
	displayIntlClock();
}