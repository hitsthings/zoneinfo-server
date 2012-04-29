var util = require('util');

var timezoneJS = require('./timezone-js');
var timezone = timezoneJS.timezone;

var fs = require('fs');
var path = require('path');

timezone.loadingScheme = timezone.loadingSchemes.MANUAL_LOAD;

var filesLoaded = false;

function loadFile(path, encoding, callback) {
  fs.readFile(path, encoding, function(err, data) {
    if(err) callback(err);
    else {
      timezone.parseZones(data);
      callback();
    }
  });
}
function loadFiles(inDir, encoding, callback) {
  var waitFor = timezone.zoneFiles.length;
  var returned = false;

  function checkFinished(err) {
    if (returned) return;

    if (err) {
      returned = true;
      callback(err);
      return;
    }

    waitFor--;

    if (!waitFor) {
      returned = true;
      callback();
      return;
    }
  }

  for (var i = 0; i < timezone.zoneFiles.length; i++) {
    var zoneFile = timezone.zoneFiles[i];
    loadFile(inDir + '/' + zoneFile, encoding, checkFinished);
  }
}

function loadFileSync(path, encoding) {
  timezone.parseZones(fs.readFileSync(path, encoding));
}
function loadFilesSync(inDir, encoding) {
  for (var i = 0; i < timezone.zoneFiles.length; i++) {
    var zoneFile = timezone.zoneFiles[i];
    loadFileSync(path.join(inDir, zoneFile), encoding);
  }
}

function formResult(citiesArray) {
  var result = {};

  if (citiesArray) {
    var zones = {};
    var rules = {};

    for (var i = 0; i < citiesArray.length; i++) {
      var city = citiesArray[i],
        ruleZone = city;

      while(typeof timezone.zones[ruleZone] === 'string') { // some zones just delegate to others. Grab the delegatee's data.
        ruleZone = timezone.zones[ruleZone];
      }

      zones[city] = timezone.zones[ruleZone];
    }
    for (var n in zones) {
      var zList = zones[n];
      for (var i = 0; i < zList.length; i++) {
        var ruleKey = zList[i][1];
        rules[ruleKey] = timezone.rules[ruleKey];
      }
    }
    result.zones = zones;
    result.rules = rules;
  }
  else {
    result.zones = timezone.zones;
    result.rules = timezone.rules;
  }
  return result;
}

function ensureValidCities(cities) {
  
  for (var i = 0; i < cities.length; i++) {
    var city = cities[i];
    if (!timezone.zones[city]) {
      return new Error(city + " is not a known city.");
    }
  }
}

exports.processFileset = function (cities, inDir, encoding, callback) {

  function returnResult() {
    var err = ensureValidCities(cities);
    if (err) callback(err);
    else callback(null, formResult(cities));
  }

  if (filesLoaded) {
    returnResult();
    return;
  }

  loadFiles(inDir, encoding, function(err) {
    if (err) callback(err);
    else {
      filesLoaded = true;
      returnResult();
    }
  });
};

exports.processFilesetSync = function(cities, inDir, encoding) {
  exports.ensureFilesLoadedSync(inDir, encoding);
  
  return formResult(cities);
};

exports.ensureFilesLoadedSync = function(inDir, encoding) {
  if (!filesLoaded) {
    exports.preloadFilesSync(inDir, encoding);
  }
};

exports.preloadFilesSync = function(inDir, encoding) {
  loadFilesSync(inDir, encoding);
  filesLoaded = true;
};

