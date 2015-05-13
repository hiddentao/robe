"use strict";


var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

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
    _classCallCheck(this, Document);

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
      } });

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
        self.__marked = {};

        for (var key in self.__doc) {
          (function (key) {
            // if property not yet defined
            if (!Object.getOwnPropertyDescriptor(self, key)) {
              // ...then define it!
              Object.defineProperty(self, key, {
                enumerable: true,
                configurable: true,
                get: function () {
                  return _.has(self.__newDoc, key) ? self.__newDoc[key] : self.__doc[key];
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
          if (!_.isFunction(self[key]) && !self.__doc.hasOwnProperty(key)) {
            delete self[key];
          }
        });
      },
      writable: true,
      configurable: true
    },
    markChanged: {


      /**
       * Mark a property as having changed.
       *
       * This is useful if you a change a value within a non-scalar (e.g. `object`) 
       * property or an array.
       * 
       * @param  {Array} ...keys Properties to mark as having changed.
       * @return {[type]}     [description]
       */
      value: function markChanged() {
        for (var _len = arguments.length, keys = Array(_len), _key = 0; _key < _len; _key++) {
          keys[_key] = arguments[_key];
        }

        for (var k in keys) {
          this.__marked[keys[k]] = true;
        }
      },
      writable: true,
      configurable: true
    },
    toJSON: {
      value: function toJSON() {
        var self = this;

        var ret = {};

        Object.keys(this).forEach(function (key) {
          if (!_.isFunction(self[key])) {
            ret[key] = self[key];
          }
        });

        return ret;
      },
      writable: true,
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
          if (!_.isFunction(self[key])) {
            if (self.__doc[key] !== self[key] || self.__marked[key]) {
              ret[key] = self[key];
            }
          }
        });

        return ret;
      },
      writable: true,
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
          } else if (!_.isFunction(self[key])) {
            // if it's a newly added one
            delete self[key];
          }
        });

        // reset marked properties
        self.__marked = {};
      },
      writable: true,
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
      configurable: true
    },
    reload: {



      /**
       * Reload this document from the collection.
       */
      value: function* reload() {
        var doc = yield this.__col.findOne({
          _id: this._id
        }, {
          rawMode: true
        });

        this._resetProperties(doc);
      },
      writable: true,
      configurable: true
    }
  });

  return Document;
})();




Document.extend = Class.extend;

module.exports = Document;