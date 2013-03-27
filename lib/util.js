/*! Module dependencies. */

var fs = require('fs');
var async = require('async');

/*! Module exports. */

exports.rm = rm;
exports.rmR = rmR;

/**
 * Takes a stat object about a file and unlinks in case of a regular file and
 * deletes it recursivly in case of a directory.
 */

function rm(file, next) {
  fs.stat(file, function (err, stat) {
    if (stat.isFile()) {
      fs.unlink(file, next);
    } else if (stat.isDirectory()) {
      rmR(file, next);
    }
  });
}

/**
 * Takes a directory path and deletes it recursivly.
 */

function rmR(dir, next) {
  fs.readdir(dir, function (err, files) {
    if (err) {
      next(err);
    } else {

      /*! Iterate through all files and handle each one appropriately. */

      async.each(
        files,
        function (file, next) {
          rm(file, next);
        },
        function (err) {
          if (err) {
            next(err);
          } else {
            fs.rmdir(dir, next);
          }
        }
      );
    }
  });
}
