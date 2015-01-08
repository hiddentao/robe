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


test['default options'] = function*() {
  robe.DEFAULT_CONNECTION_OPTIONS.should.eql({
    timeout: 3000
  });
};


test['connect'] = {
  'valid': function*() {
    yield robe.connect('127.0.0.1');
  },
  'timeout': {
    'default': function*() {
      this.timeout(robe.DEFAULT_CONNECTION_OPTIONS.timeout * 2);

      try {
        yield robe.connect('127.123.121.233');

        throw new Error('Should not be here');
      } catch (err) {
        err.message.should.eql('Timed out connecting to db');
      }
    },
    'custom': function*() {
      try {
        yield robe.connect('127.123.121.233', {
          timeout: 100
        });

        throw new Error('Should not be here');
      } catch (err) {
        err.message.should.eql('Timed out connecting to db');
      }
    },
  },
  'replica set': function*() {
    yield robe.connect(['127.0.0.1/robe-test','localhost/robe-test']);
  },
};




