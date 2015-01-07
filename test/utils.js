"use strict";


require('co-mocha');

var chai = require('chai'),
  sinon = require('sinon');

chai.use(require('sinon-chai'));

exports.assert = chai.assert;
exports.expect = chai.expect;
exports.should = chai.should();

exports.sinon = sinon;

exports.robe = require('../');
