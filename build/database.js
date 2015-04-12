"use strict";


var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _ = require("lodash"),
    debug = require("debug")("robe-db"),
    Class = require("class-extend"),
    Q = require("bluebird"),
    MongoOplog = require("mongo-oplog");

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
    _classCallCheck(this, Database);

    this.db = db;
    this.watchers = {};
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
          var self = this;

          var stopOplog = false && self.oplog ? Q.promisify(self.oplog.stop, self.oplog)() : Q.resolve();

          return stopOplog.then(function () {
            delete self.oplog;

            return Q.promisify(self.db.close, self.db)();
          });
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
    },
    watch: {



      /**
       * Register given callback as an oplog watcher.
       *
       * This will notify the given callback when data gets 
       * changed, either through this or other MongoDB connections.
       *
       * @param {String} collectionName Name of collection to watch.
       * @param {Function} callback Callback to notify when a change occurs.
       */
      value: function watch(collectionName, callback) {
        this._setupOplog();

        if (!this.watchers[collectionName]) {
          this.watchers[collectionName] = [];
        }

        this.watchers[collectionName].push(callback);
      },
      writable: true,
      configurable: true
    },
    unwatch: {


      /**
       * De-register given callback as an oplog watcher.
       * 
       * @param {String} collectionName Name of collection to watch.
       * @param {Function} callback Callback to notify when a change occurs.
       */
      value: function unwatch(collectionName, callback) {
        if (this.watchers[collectionName]) {
          this.watchers[collectionName] = _.remove(this.watchers[collectionName], function (v) {
            return v === callback;
          });
        }
      },
      writable: true,
      configurable: true
    },
    _setupOplog: {



      /**
       * Setup the oplog.
       */
      value: function _setupOplog() {
        var self = this;

        if (self.oplog) {
          return;
        }

        var oplog = self.oplog = MongoOplog(self.db.driver);

        ["insert", "update", "delete"].forEach(function (e) {
          oplog.on(e, _.bind(self._onOplogEvent, self, e));
        });

        oplog.on("error", function (err) {
          console.error("Oplog tailing error");
          console.error((err.stack || []).join("\n"));
        });

        oplog.on("end", function () {
          console.log("Oplog tailing ended");
        });

        oplog.tail(function () {
          console.log("Oplog tailing started");
        });
      },
      writable: true,
      configurable: true
    },
    _onOplogEvent: {


      /**
       * Handle an oplog event.
       */
      value: function _onOplogEvent(eventType, data) {
        console.log(eventType, data);
        // this.watchers.each(function(w) {
        //   w(eventType, data);
        // });
      },
      writable: true,
      configurable: true
    }
  });

  return Database;
})();

Database.extend = Class.extend;



module.exports = Database;