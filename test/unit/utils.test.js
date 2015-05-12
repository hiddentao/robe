var mongodb = require('mongodb');

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


var test = utils.createTest(module);


test.afterEach = function*() {
  yield Robe.closeAll();
}


test['ObjectID utils'] = {
  beforeEach: function*() {
    this.db = yield Robe.connect('127.0.0.1/robe-test');
    this.collection = this.db.collection('test');
    
    this.doc = yield this.collection.insert({
      name: 'john'
    });
  },
  afterEach: function*() {
    yield this.collection.remove();
  },  
  'isObjectID': function*() {    
    RobeUtils.isObjectID( this.doc._id ).should.be.false;
    RobeUtils.isObjectID( new mongodb.ObjectID() ).should.be.true;
  },
  'isObjectIDStr': function*() {    
    RobeUtils.isObjectIDStr( 'abc' ).should.be.false;

    expect(typeof this.doc._id).to.eql('object');
    RobeUtils.isObjectIDStr( this.doc._id ).should.be.false;
    
    var str = this.doc._id.toString();
    RobeUtils.isObjectIDStr( str ).should.be.true;
  },
  'toObjectId': function*() {
    this.doc._id.should.not.be.instanceOf(mongodb.ObjectID);
    RobeUtils.toObjectID( this.doc._id.toString() ).should.be.instanceOf(mongodb.ObjectID);
  },
};



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




test['isGen'] = function*(){
  RobeUtils.isGen(function*() {}).should.be.true;
  RobeUtils.isGen(function() {}).should.be.false;
};




