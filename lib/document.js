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
      __newDoc: {
        enumerable: false,
        writable: true,
        value: {}
      }
    });

    this._resetProperties(doc);
  }

  /**
   * Reset original properties to given doc.
   * @private
   */
  _resetProperties (doc) {
    var self = this;

    Object.defineProperty(self, '__doc', {
      enumerable: false,
      writable: true,
      value: doc
    });

    self.__newDoc = {};

    for (let key in self.__doc) {
      // if property not yet defined
      if (!Object.getOwnPropertyDescriptor(self, key)) {
        // ...then define it!
        Object.defineProperty(self, key, {
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

    // delete any extraneous properties
    Object.keys(this).forEach(function(key) {
      if (!self.__doc.hasOwnProperty(key)) {
        delete self[key];
      }
    });
  }


  toJSON () {
    var self = this;

    var ret = {};

    Object.keys(this).forEach(key => ret[key] = self[key]);

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
    var changes = this.changes();

    yield this.__col.update({
      _id: this._id,
    }, {
      $set: changes
    });

    // reset properties
    this._resetProperties(this.toJSON());
  }

  /**
   * Remove this document from the collection.
   */
  * remove () {
    yield this.__col.remove({
      _id: this._id
    });
  }
}

Document.extend = Class.extend;

module.exports = Document;


