var _ = require('lodash'),
  Q = require('bluebird');


var utils = require('./utils'),
  robe = utils.robe,
  assert = utils.assert,
  expect = utils.expect,
  should = utils.should,
  sinon = utils.sinon;


var mocker;


var test = module.exports = {
  beforeEach: function*() {
    mocker = sinon.sandbox.create();
  },
  afterEach: function*() {
    mocker.restore();

    yield robe.closeAll();
  }
};


test['connect'] = {
  'valid': function*() {
    yield robe.connect('127.0.0.1');
  },
  'timeout': function*() {
    this.timeout(robe.defaultConnectionOptions().timeout * 2);

    try {
      yield robe.connect('127.123.121.233');

      throw new Error('Should not be here');
    } catch (err) {
      err.message.should.eql('Timed out connecting to db');
    }
  },
  'replica set': function*() {
    yield robe.connect(['127.0.0.1/robe-test','localhost/robe-test']);
  },
};




