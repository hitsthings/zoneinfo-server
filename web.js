var zoneinfo = require('./zoneinfo');

var app = zoneinfo.createApp();

var util = require('util');

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});