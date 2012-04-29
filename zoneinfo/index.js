var express = require('express');

var conf = require('./conf');

var timezoneJSparser = require('./timezone-js/preparse');
var timezoneJS = require('./timezone-js/timezone-js');

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

function handleGetZonesForCities(req, res, next) {
	var cities = req.param('city') || [];
	if (typeof cities === 'string') cities = [ cities ];

	console.log("cities:" + cities);

	if (cities.length) {
		timezoneJSparser.processFileset(cities, conf.dataDir, conf.dataEncoding, function(err, data) {
			if (err) next(err);
			else res.send(data);
		});

	} else next();
}


var zones;
function handleListCities(req, res, next) {

	timezoneJSparser.ensureFilesLoadedSync(conf.dataDir, conf.dataEncoding);

	if (!zones) {
		zones = [];
		for(var zone in timezoneJS.timezone.zones) {
			zones.push(zone);
		}
	}

	res.send(zones);

}

exports.createApp = function() {

	var app = express.createServer(express.logger());

	conf.configure(app);

	app.get('/', function(req, res) {
		res.contentType("text/html");
		res.send('<!DOCTYPE html>\n<title>Zoneinfo Server</title>' +
			'<p>This service has two JSON (via CORS) and JSONP endpoints. Add a ?callback=fn_name param for a JSONP response.</p>' +
			'<ul>' +
				'<li>Use <a href="./cities">/cities</a> to see the list cities you can obtain timezone info for.</li>' +
				'<li>Use <a href="./zones?city=America/Chicago&city=America/New_York&callback=fn_name">/zones?city=X&city=Y&callback=fn_name</a> to get timezone info you can use with <a href="https://github.com/mde/timezone-js">timezone-js</a> (or however you like).</li>' +
			'</ul>' +
			'<p>Source on <a href="">GitHub</a> and <a href="">Bitbucket</a>.</p>' +
			'<p>Made with JS, love, and <a href="http://noiregrets.com">noir egrets</a> by <a href="http://www.twitter.com/hitsthings">@hitsthings</a>.</p>');
	});

	app.get('/zones', allowCORS, handleNonJSON, handleGetZonesForCities, function(request, response) {
	  response.send('To use this service, specify cities using query string parameters. E.g., /zones?city=America/Chicago&city=America/New_York');
	});

	app.get('/cities', allowCORS, handleNonJSON, handleListCities);


function demo() {
	// timezone-js needs to remove it's dependency on Fleegix...
	fleegix.xhr = {
		doGet : function(success, url) { $.ajax(url, { processData: false }).done(function(data) { success(JSON.stringify(data)); }); }
	};


	var _tz = timezoneJS.timezone;
	_tz.loadingScheme = _tz.loadingSchemes.MANUAL_LOAD;
	_tz.zoneFileBasePath = 'stop hassling me';
	_tz.loadZoneJSONData('./zones?city=America/Los_Angeles&city=America/New_York&city=Australia/Sydney&city=Asia/Tokyo');
	
	var div = document.createElement('div');
	document.body.appendChild(div);

	function getTimes() {
		var now = new Date(),
		nowLA = new timezoneJS.Date(now)
		'America/Los_Angeles'),
		nowNY = new timezoneJS.Date(now)
		'America/New_York'),
		nowSyd = new timezoneJS.Date(now)
		 'Australia/Sydney'),
		nowTokyo = new timezoneJS.Date(now)
		'Asia/Tokyo');

	
		div.innerHTML = '<dl>' +
				'<dt>You</dt><dd>' + now.toString() + '</dd>' +
				'<dt>Los Angeles</dt><dd>' + nowLA.toString() + '</dd>' +
				'<dt>New York</dt><dd>' + nowNY.toString() + '</dd>' +
				'<dt>Sydney</dt><dd>' + nowSyd.toString() + '</dd>' +
				'<dt>Tokyo</dt><dd>' + nowTokyo.toString() + '</dd>' +
			'</dl>';
	}
	
	setInterval(getTimes, 1000);		
}
	app.get('/demo', function(req, res) {
		res.send('<!DOCTYPE html>\n<head><title>Demo page</title><script src="http://code.jquery.com/jquery-1.7.2.min.js"></script><script src="https://raw.github.com/mde/timezone-js/master/src/date.js"></script><style>script { display: block; white-space: pre; }</style></head>' +
			'<body>' +
				'<script>\n' + demo.toString() + '\ndemo();</script>' +
			'</body>');
	});

	return app;
};