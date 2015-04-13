"use strict";


var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _ = require("lodash"),
    debug = require("debug")("robe-db"),
    Class = require("class-extend"),
    Q = require("bluebird");

var Collection = require("./collection"),
    Oplog = require("./oplog");



/**
 * Represents a database connection.
 */
var Database = (function () {
  /**
   * Constructor.
   * @param  {Object} db Mongoskin db connection.
   */
  function Database(db) {
    _classCallCheck(this, Database);

    this.db = db;
  }

  _prototypeProperties(Database, null, {
    oplog: {


      /**
       * Get oplog watcher.
       *
       * This will create and start the watcher if not already done so.
       */
      value: function* oplog() {
        if (!this._oplog) {
          this._oplog = new Oplog(this.db);
          yield this._oplog.start();
        }

        return this._oplog;
      },
      writable: true,
      configurable: true
    },
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
      configurable: true
    }
  });

  return Database;
})();

Database.extend = Class.extend;



module.exports = Database;