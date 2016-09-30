var _ = require('lodash'),
  Q = require('bluebird');


var utils = require('../testutils'),
  assert = utils.assert,
  expect = utils.expect,
  should = utils.should,
  sinon = utils.sinon;

var Robe = utils.Robe,
  Database = Robe.Database;



var test = utils.createTest(module);


test.afterEach = function*() {
  yield Robe.closeAll();
}



test['connect'] = {
  'valid': function*() {
    var db = yield Robe.connect('127.0.0.1/robe-test');

    db.should.be.instanceOf(Robe.Database);
  },
  'bad': function*() {
    try {
      yield Robe.connect('127.123.121.233', {
        timeout: 100
      });

      throw new Error('Should not be here');
    } catch (err) {
      err.message.should.eql('Timed out connecting to db');
    }
  },
  'replica set': function*() {
    var db = yield Robe.connect(['127.0.0.1/robe-test/robe-test','localhost/robe-test']);

    db.should.be.instanceOf(Robe.Database);    
  },
};




