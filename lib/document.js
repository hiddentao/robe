"use strict";


var _ = require('lodash'),
  debug = require('debug')('robe-record'),
  Class = require('class-extend'),
  Q = require('bluebird')



/**
 * Represents a document within a collection.
 */
class Document {
  /**
   * Constructor.
   *
   * @param  {Collection} collection The underlying collection.
   * @param  {Object} doc The actual Mongo record document.
   */
  constructor (collection, doc) {
    this.collection = collection;
    this.doc = doc;
    this._id = this.doc._id;
  }

  /**
   * Persist changes made to this document.
   */
  * save () {
    yield this.collection.update({
      _id: this._id,
    }, {
      $set: this.doc
    });
  }

  /**
   * Remove this document from the collection.
   */
  * remove () {
    yield this.collection.remove({
      _id: this._id,
    });
  }
}

Document.extend = Class.extend;

module.exports = Document;


