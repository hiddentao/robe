"use strict";

require('co-mocha');

var utils = require('./utils'),
  assert = utils.assert,
  expect = utils.expect,
  should = utils.should,
  sinon = utils.sinon,
  Robe = utils.Robe;


var test = module.exports = {
  beforeEach: function*() {
    this.mocker = sinon.sandbox.create();

    // for bluebird promises to work without delay
    this.mocker.stub(process, 'nextTick').yields();
  },
  afterEach: function*() {
    this.mocker.restore();

    yield Robe.closeAll();
  }
};



['manager', 'database', 'collection'].forEach(function(f) {
  test[f] = require('./units/' + f + '.test.js');
})

