"use strict";


var _ = require('lodash'),
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
      },
      __marked: {
        enumerable: false,
        writable: true,
        value: {}
      },
      // can store any extra data that's not intended for persistence in this field
      __extra: {
        enumerable: false,
        writable: true,
        value: {}
      },
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
    self.__marked = {};

    for (let key in self.__doc) {
      // if property not yet defined
      if (!Object.getOwnPropertyDescriptor(self, key)) {
        // ...then define it!
        Object.defineProperty(self, key, {
          enumerable: true,
          configurable: true,
          get: function() {
            return _.has(self.__newDoc, key) ? self.__newDoc[key] : self.__doc[key];
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


  /**
   * Mark a property as having changed.
   *
   * This is useful if you a change a value within a non-scalar (e.g. `object`) 
   * property or an array.
   * 
   * @param  {Array} ...keys Properties to mark as having changed.
   * @return {[type]}     [description]
   */
  markChanged (...keys) {
    for (let k in keys) {
      this.__marked[keys[k]] = true;
    }
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
      if ( (self.__doc[key] !== self[key]) 
              || self.__marked[key] ) {
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

    // reset marked properties
    self.__marked = {};
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



  /**
   * Reload this document from the collection.
   */
  * reload () {
    var doc = yield this.__col.findOne({
      _id: this._id
    }, {
      rawMode: true
    });

    this._resetProperties(doc);
  }
}


Document.extend = Class.extend;

module.exports = Document;


