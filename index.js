module.exports = nodeTeX;
module.exports.require = require;
var _require = module.exports.require;
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var tmp = require('tmp');
var util = require('util');
var async = require('async');
var rmR = require('./lib/util').rmR;
function TeXError(line, error, message) {
  this.line = line;
  this.error = error;
  this.message = message;
}
function runTeX(options, callback) {
  var tex;
  if (options.env) {
    options.env.__proto__ = process.env;
  }
  tex = spawn(
    options.command,
    [
      '--no-shell-escape', // for security reasons
      '--file-line-error', // simplifies error checking
      '--interaction=batchmode', // avoids doubling of log on stdout
      options.filename
    ],
    {
      cwd: options.path,
      env: options.env
    }
  );
  tex.on('exit', function (code) {
    if (code !== 0) {
      fs.readFile(options.file, 'utf8', function(log) {
        var errors = checkLog(log);
        if (errors === []) {
          process.nextTick(function () {
            runTeX(options, callback);
          });
        } else {
          callback(errors);
        }
      });
    } else {
      rmR(options.path, callback);
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

function nodeTeX(stream, dependencies, options, callback) {
  if (!util.isArray(dependencies) && typeof dependencies === 'object') {
    callback = options;
    options = dependencies;
    dependencies = [];
  } else if (typeof dependencies === 'function') {
    callback = dependencies;
    dependencies = [];
    options = {};
  } else if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  options.command = options.command || 'lualatex';
  options.filename = 'texput.tex';
  tmp.dir(
    {
      prefix: 'node-tex-tmp'
    }, 
    function (err, tmpPath) {
      if (err) throw err;
      async.forEach(
        dependencies,
        function (item, callback) {
          var dependancy = path.join(options.path, item.filename) + '.tex';
          var stream = fs.createWriteStream(dependancy);
          item.on('end', function () {
              callback();
          });
          item.pipe(stream);
        },
        function (err) {
          var writeStream;
          options.path = tmpPath;
          options.file = path.join(options.path, options.filename);
          writeStream = fs.createWriteStream(options.file);
          writeStream.on('close', function (err) {
            runTeX(options, function (err) {
              var pdf = path.join(
                options.path,
                path.basename(options.filename, '.tex') + '.pdf'
              );
              if (err) {
                callback(err);
              } else {
                callback(null, fs.createReadStream(pdf));
              }
            });
          });
          writeStream.on('error', callback);
          stream.pipe(writeStream);
        }
      );
    }
  );
};
