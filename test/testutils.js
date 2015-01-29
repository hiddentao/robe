"use strict";


var chai = require('chai'),
  path = require('path'),
  sinon = require('sinon');

chai.use(require('sinon-chai'));

exports.assert = chai.assert;
exports.expect = chai.expect;
exports.should = chai.should();

exports.sinon = sinon;

exports.Robe = require('../');
