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


exports.createTest = function(_module) {
  var test = _module.exports = {};

  var testMethods = {};
  
  test[path.basename(_module.filename)] = {
    beforeEach: function*() {
      this.mocker = sinon.sandbox.create();
    },
    afterEach: function*() {
      this.mocker.restore();
    },
    'tests': testMethods
  };

  return testMethods;
};
