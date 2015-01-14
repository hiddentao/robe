var _ = require('lodash'),
  monk = require('monk'),
  Q = require('bluebird');


var utils = require('../utils'),
  assert = utils.assert,
  expect = utils.expect,
  should = utils.should,
  sinon = utils.sinon;

var Robe = utils.Robe,
  Database = Robe.Database,
  Collection = Robe.Collection,
  Document = Robe.Document;


var test = module.exports = {};



test['constructor'] = function*() {
  var d = new Document(123, {
    name: 'john'
  });

  d.__col.should.eql(123);
  d.name.should.eql('john');
};



test['toJSON()'] = function*() {
  var d = new Document(123, {
    name: 'john'
  });

  d.toJSON().should.eql({
    name: 'john'
  });
};



test['changes()'] = function*() {
  var d = new Document(123, {
      name: 'john',
      age: 23,
      hasKids: true
  });

  d.changes().should.eql({});
};





test['change props'] = {
  beforeEach: function() {
    var d = this.d = new Document(123, {
      name: 'john',
      age: 23,
      hasKids: true
    });

    d.name.should.eql('john');
    d.age.should.eql(23);
    d.hasKids.should.be.true;

    d.name = 'tim';
    d.mother = 'mary';
  },

  'updated getters': function*() {
    this.d.name.should.eql('tim');
    this.d.mother.should.eql('mary');
  },

  'toJSON()': function*() {
    this.d.toJSON().should.eql({
      name: 'tim',
      mother: 'mary',
      age: 23,
      hasKids: true
    });
  },

  'changes()': function*() {
    this.d.changes().should.eql({
      name: 'tim',
      mother: 'mary'
    });
  },

  'reset()': function*() {
    this.d.reset();

    this.d.changes().should.eql({});
    this.d.name.should.eql('john');
    expect(this.d.mother).to.be.defined;

    this.d.toJSON().should.eql({
      name: 'john',
      age: 23,
      hasKids: true
    })
  }
};



test['save'] = function*() {
  
};




