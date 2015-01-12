"use strict";


require('co-mocha');

var chai = require('chai'),
  path = require('path'),
  sinon = require('sinon');

chai.use(require('sinon-chai'));

exports.assert = chai.assert;
exports.expect = chai.expect;
exports.should = chai.should();

exports.sinon = sinon;

exports.Robe = require('../');

exports.createTest = function(mod) {
  var name = path.basename(mod.filename, '.test.js');

  var test = mod.exports = {
    beforeEach: function*() {
      this.mocker = sinon.sandbox.create();

      // for bluebird promises to work without delay
      this.mocker.stub(process, 'nextTick').yields();
    },
    afterEach: function*() {
      this.mocker.restore();

      yield exports.Robe.closeAll();
    }
  };

  test[name] = {};

  return test[name];
};


