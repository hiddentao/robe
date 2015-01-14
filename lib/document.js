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
   * @param  {Object} [doc] The Mongo record document.
   */
  constructor (collection, doc = {}) {
    var self = this;

    Object.defineProperties(this, {
      __col: {
        enumerable: false,
        writable: false,
        value: collection
      },
      __doc: {
        enumerable: false,
        value: doc
      },
      __newDoc: {
        enumerable: false,
        value: {}
      }
    });

    for (let key in self.__doc) {
      Object.defineProperty(this, key, {
        enumerable: true,
        get: function() {
          return self.__newDoc[key] || self.__doc[key];
        },
        set: function(val) {
          self.__newDoc[key] = val;
        }
      });
    }
  }

  toJSON () {
    var self = this;

    var ret = {};

    Object.keys(this).forEach(function(key) {
      ret[key] = self[key];
    });

    return ret;
  }

  /**
   * Get changed properties.
   * @return {Object}
   */
  changes () {
    var self = this;

    var ret = {};

    Object.keys(this).forEach(function(key) {
      if (self.__doc[key] !== self[key]) {
        ret[key] = self[key];
      }
    });

    return ret;
  }


  /**
   * Reset all changes made to this doc.
   *
   * This will remove newly added properties and revert pre-existing ones 
   * to their original values.
   */
  reset () {
    var self = this;

    Object.keys(this).forEach(function(key) {
      // if it's an original property
      if (self.__doc.hasOwnProperty(key)) {
        delete self.__newDoc[key];
      }
      // if it's a newly added one
      else {
        delete self[key];
      }
    });
  }


  /**
   * Persist changes made to this document.
   */
  * save () {
    yield this.collection.update({
      _id: this._id,
    }, {
      $set: this.changes()
    });
  }

  /**
   * Remove this document from the collection.
   */
  * remove () {
    yield this.collection.remove({
      _id: this._id
    });
  }
}

Document.extend = Class.extend;

module.exports = Document;


