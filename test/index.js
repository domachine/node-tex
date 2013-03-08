var mockery = require('mockery'),
    nodeTex,
    ReadStream = require('string-stream').Readable,
    Pipe = require('pipette').Pipe,
    EventEmitter = require('events').EventEmitter,
    should = require('should');
    path = require('path');
describe('NodeTeX', function () {
  var options = {
    prefix: 'node-tex-test',
    command: 'test-tex',
    path: 'test-path'
  };
  before(function () {
    mockery.enable();
    mockery.registerMock('fs', {
      createWriteStream: function (file) {
        var pipe = new Pipe();
        file.should.match(/^.*\/node-tex-test.*\/texput.tex/);
        pipe.reader.on('data', function (data) {
          data.toString().should.equal('Test');
        });
        return pipe.writer;
      },
      readFile: function () {
        return '';
      },
      createReadStream: function (file) {
        var pdf = path.join(
          options.path,
          path.basename(options.filename, '.tex') + '.pdf'
        );
        file.should.equal(pdf);
      }
    });
    mockery.registerMock('child_process', {
      spawn: function (command, opt, env) {
        function Process() {
          var self = this;
          process.nextTick(function () {
            self.emit('exit', 0);
          });
        }
        Process.prototype = Object.create(EventEmitter.prototype);
        command.should.equal(options.command);
        should.exist(opt);
        should.exist(env);
        env.cwd.should.equal(options.path);
        return new Process();
      }
    });
    mockery.registerMock('tmp', {
      dir: function (opts, callback) {
        callback(null, '/tmp/' + options.prefix + '1234');
      }
    });
    mockery.registerAllowables(['path', '../index']);
    nodeTex = require('../index');
  });
  it('should run valid sample', function (done) {
    var stream = new ReadStream('Test');
    nodeTex(stream, options, function () {
      done();
    });
  });
});
