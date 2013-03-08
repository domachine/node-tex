var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var tmp = require('tmp');
function TeXError(line, error, message) {
this.line = line;
  this.error = error;
  this.message = message;
}
function runTeX(options, callback) {
  var tex;
  tex = spawn(
    options.command,
    [
      '--no-shell-escape', // for security reasons
      '--file-line-error', // simplifies error checking
      '--interaction=batchmode', // avoids doubling of log on stdout
      options.filename
    ],
    {
      cwd: options.path
    }
  );
  tex.on('exit', function (code) {
    if (code !== 0) {
      fs.readFile(options.file, 'utf8', function(log) {
        var errors = checkLog(log);
        if (errors === []) {
          runTeX(options);
        } else {
          callback(errors);
        }
      });
    } else {
      callback();
    }
  });
}
function checkLog(log) {
  return [];
}

/**
 * The main entry function.  It is called with the stream that should be
 * processed.
 * @param {Stream|String} stream The stream/string that should be processed.
 * @param {Object} options The object that configures the backend. It supports the
 * following keys:
 * * `filename` - The filename to use for the temporary texfile.
 * * `command` - The command to use.
 */

function nodeTeX(stream, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
  options.command = options.command || 'lualatex';
  options.filename = 'texput.tex';
  tmp.dir(
    {
      prefix: 'node-tex-tmp', 
      keep: options.keep || false
    }, 
    function (err, tmpPath) {
      var writeStream;
      if (err) throw err;
      options.path = tmpPath;
      options.file = path.join(options.path, options.filename);
      writeStream = fs.createWriteStream(options.file);
      writeStream.on('end', function (err) {
        runTeX(options, callback);
      });
      writeStream.on('error', callback);
      stream.pipe(writeStream);
    }
  );
};
module.exports = nodeTeX;
