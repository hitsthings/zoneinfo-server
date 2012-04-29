exports.processFile = function(fn, inPath, outPath, encoding, callback) {
	fs.readFile(inPath, encoding, function(err, data) {
		if (err) {
			callback && callback(err);
		}
		else {
			fs.writeFile(outPath, fn(data), encoding, callback);
		}
	});
};

exports.processFileSync = function(fn, inPath, outPath, encoding) {
	fs.writeFileSync(outPath, fn(fs.readFileSync(inPath, encoding)), encoding);
};