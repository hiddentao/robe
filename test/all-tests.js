"use strict";

require('co-mocha');

var fs = require('fs'),
  path = require('path');

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



var files = require('fs').readDirSync(path.join(__dirname, 'units'));
console.log(files);

// ['manager', 'database', 'collection'].forEach(function(f) {
//   if ('collection' !== f) return;

//   test[f] = require('./units/' + f + '.test.js');
// })

