var filePipe = require('filePipe');

var strip = exports.strip = function(inputStr) {
	return inputStr.replace(/^(#[^\n]*)?\n/gm, '');
};

exports.processFile = function(inPath, outPath, encoding, callback) {
	filePipe.processFile(strip, inPath, outPath, encoding, callback);
};

exports.processFileSync = function(inPath, outPath, encoding) {
	filePipe.processFileSync(strip, inPath, outPath, encoding);
};