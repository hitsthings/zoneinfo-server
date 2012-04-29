var express = require('express');
var path = require('path');

exports.configure = function(app) {

	app.configure(function() {
  		app.enable('jsonp callback');
  		app.use(express.bodyParser());
	});

	app.configure('development', function() {
		app.use(express.responseTime());
	    app.use(express.static(__dirname + '/public'));
	    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	});

	app.configure('production', function() {
		var oneYear = 31557600000;
	    app.use(express.static(__dirname + '/public', { maxAge: oneYear}));
	  app.use(express.errorHandler());
	});

	return app;
};

exports.dataDir = path.join(__dirname, 'public/latest');
exports.dataEncoding = 'utf8';