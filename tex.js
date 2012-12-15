var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

var tmp = require('tmp');


function TeXError(line, error, message) {
    this.line = line;
    this.error = error;
    this.message = message;
}

function runTeX(options) {
    var tex = spawn(options.command,
            ['--no-shell-escape', // for security reasons
            '--file-line-error', // simplifies error checking
            '--interaction=batchmode', // avoids doubling of log on stdout
            options.filename],
        {cwd: options.path});

    tex.on('exit', function (code) {
        if (code !== 0) {
            fs.readFile(options.file, 'utf8', function(log) {
                var errors = checkLog(log);

                if (errors === []) {
                    runTeX(options);
                } else {
                    throw errors;
                }
            });
        }
    });
}

function checkLog(log) {
    return [];
}

module.exports = exports = function (text, options) {
    options = options || {};
    options.command = options.command || 'lualatex';
    options.filename = 'texput.tex';

    tmp.dir({prefix: 'node-tex-tmp', keep: true}, function (err, tmpPath) {
        if (err) throw err;

        options.path = tmpPath;
        options.file = path.join(options.path, options.filename);
        fs.writeFile(options.file, text, function (err) {
            if (err) throw err;

            runTeX(options);
        });
    });
}
