var mockery = require('mockery');
var directoryStat = {
  isDirectory: function () {
    return true;
  },
  isFile: function () {
    return false;
  }
};
var fileStat = {
  isDirectory: function () {
    return false;
  },
  isFile: function () {
    return true;
  }
};
describe('utils', function () {
  var fsCtx;
  beforeEach(function () {
    fsCtx = {};
    mockery.enable({ useCleanCache: true });
    mockery.registerMock('fs', fsCtx);
    mockery.registerAllowables([ '../lib/util', 'async' ]);
  });
  it('should delete the right file or directory', function (done) {
    var util = require('../lib/util');
    var testDir = '/test/path';
    var nestedFiles = [
      'file1',
      'file2',
      'file3'
    ];
    fsCtx.readdir = function (path, next) {
      path.should.equal('/test/path');
      next(null, nestedFiles);
    };
    fsCtx.stat = function (path, next) {
      if (nestedFiles.indexOf(path) > -1) {
        next(null, fileStat);
      } else {
        next(null, directoryStat);
      }
    };
    fsCtx.unlink = function (path, next) {
      nestedFiles.indexOf(path).should.not.equal(-1);
      next();
    };
    fsCtx.rmdir = function (path, next) {
      path.should.equal(testDir);
      next();
    };
    util.rm(testDir, done);
  });
});
