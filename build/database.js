"use strict";


var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _ = require("lodash"),
    debug = require("debug")("robe-db"),
    Class = require("class-extend"),
    Q = require("bluebird");

var Collection = require("./collection");



/**
 * Represents a database connection.
 */
var Database = (function () {
  /**
   * Constructor.
   * @param  {Object} db Mongoskin db connection.
   */
  function Database(db) {
    this.db = db;
  }

  _prototypeProperties(Database, null, {
    close: {


      /**
       * Close this database connection.
       * @return {Promise}
       */
      value: function close() {
        debug("close");

        if (2 === _.deepGet(this.db, "driver._state")) {
          return Q.promisify(this.db.close, this.db)();
        } else {
          return Q.resolve();
        }
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    collection: {


      /**
       * Fetch a collection from the db.
       *
       * @param {Object} [options] Additional options.
       * @param {Object} [options.schema] Collection schema.
       * 
       * @return {Collection}
       */
      value: function collection(name, options) {
        return new Collection(this.db.get(name), options);
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return Database;
})();

Database.extend = Class.extend;



module.exports = Database;