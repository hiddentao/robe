var _ = require('lodash'),
  monk = require('monk'),
  Q = require('bluebird');


var utils = require('../testutils'),
  assert = utils.assert,
  expect = utils.expect,
  should = utils.should,
  sinon = utils.sinon;

var Robe = utils.Robe,
  Collection = Robe.Collection,
  Document = Robe.Document,
  RobeUtils = Robe.Utils;


var test = module.exports = {};



test['formatMongoDoc()'] = {
  'default': function*() {
    var collection = new Collection(123);

    var ret = RobeUtils.formatMongoDoc(collection, {
      name: 'Tim'
    });

    ret.should.be.instanceOf(Document);
  },

  'raw - local option': function*() {
    var collection = new Collection(123);

    var ret = RobeUtils.formatMongoDoc(collection, {
      name: 'Tim'
    }, {
      rawMode: true
    });

    ret.should.not.be.instanceOf(Document);

    ret.name.should.eql('Tim');
  },

  'raw - global option': function*() {
    var collection = new Collection(123, {
      rawMode: true
    });

    var ret = RobeUtils.formatMongoDoc(collection, {
      name: 'Tim'
    }, {
      rawMode: false
    });

    ret.should.not.be.instanceOf(Document);

    ret.name.should.eql('Tim');
  },
}



test['bindGen'] = {
  'no args': function*() {
    var fn = RobeUtils.bindGen(function*() {
      return yield Q.resolve(this.a + 12);
    }, {
      a: 5
    });

    (yield fn()).should.eql(17);
  },
  'no args': function*() {
    var fn = RobeUtils.bindGen(function*(b, c) {
      return yield Q.resolve(this.a + b * c + 12);
    }, {
      a: 5
    });

    (yield fn(9, 3)).should.eql(44);
  }
};

