"use strict";


var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _ = require("lodash"),
    Class = require("class-extend"),
    Q = require("bluebird");



/**
 * Represents a document within a collection.
 */
var Document = (function () {
  /**
   * Constructor.
   *
   * @param  {Collection} collection The underlying collection.
   * @param  {Object} [doc] The Mongo record document.
   */
  function Document(collection) {
    var doc = arguments[1] === undefined ? {} : arguments[1];
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

  _prototypeProperties(Document, null, {
    _resetProperties: {

      /**
       * Reset original properties to given doc.
       * @private
       */
      value: function _resetProperties(doc) {
        var self = this;

        Object.defineProperty(self, "__doc", {
          enumerable: false,
          writable: true,
          value: doc
        });

        self.__newDoc = {};

        for (var key in self.__doc) {
          (function (key) {
            // if property not yet defined
            if (!Object.getOwnPropertyDescriptor(self, key)) {
              // ...then define it!
              Object.defineProperty(self, key, {
                enumerable: true,
                get: function () {
                  return self.__newDoc[key] || self.__doc[key];
                },
                set: function (val) {
                  self.__newDoc[key] = val;
                }
              });
            }
          })(key);
        }

        // delete any extraneous properties
        Object.keys(this).forEach(function (key) {
          if (!self.__doc.hasOwnProperty(key)) {
            delete self[key];
          }
        });
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    toJSON: {
      value: function toJSON() {
        var self = this;

        var ret = {};

        Object.keys(this).forEach(function (key) {
          return ret[key] = self[key];
        });

        return ret;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    changes: {

      /**
       * Get changed properties.
       * @return {Object}
       */
      value: function changes() {
        var self = this;

        var ret = {};

        Object.keys(this).forEach(function (key) {
          if (self.__doc[key] !== self[key]) {
            ret[key] = self[key];
          }
        });

        return ret;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    reset: {


      /**
       * Reset all changes made to this doc.
       *
       * This will remove newly added properties and revert pre-existing ones 
       * to their original values.
       */
      value: function reset() {
        var self = this;

        Object.keys(this).forEach(function (key) {
          // if it's an original property
          if (self.__doc.hasOwnProperty(key)) {
            delete self.__newDoc[key];
          }
          // if it's a newly added one
          else {
            delete self[key];
          }
        });
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    save: {


      /**
       * Persist changes made to this document.
       */
      value: function* save() {
        var changes = this.changes();

        yield this.__col.update({
          _id: this._id }, {
          $set: changes
        });

        // reset properties
        this._resetProperties(this.toJSON());
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    remove: {

      /**
       * Remove this document from the collection.
       */
      value: function* remove() {
        yield this.__col.remove({
          _id: this._id
        });
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return Document;
})();

Document.extend = Class.extend;

module.exports = Document;