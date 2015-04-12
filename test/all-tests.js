"use strict";

require('co-mocha');

var fs = require('fs'),
  path = require('path');

var utils = require('./testutils'),
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



var units = require('fs').readdirSync(path.join(__dirname, 'units'));

units.forEach(function(f) {
  if (0 > f.indexOf('oplog.test.js')) {
    return;
  }

  var name = path.basename(f, '.test.js');

  test[name] = require('./units/' + f);
});

