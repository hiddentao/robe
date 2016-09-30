"use strict";


var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _ = require("lodash"),
    debug = require("debug")("robe"),
    Q = require("bluebird"),
    monk = require("monk"),
    Database = require("./database");



/**
 * All db connections.
 * @type {Array}
 */
var dbConnections = [];


/**
 * Overall database manager and entry point to Robe.
 */
var Manager = (function () {
  function Manager() {
    _classCallCheck(this, Manager);
  }

  _prototypeProperties(Manager, {
    connect: {
      /**
       * Connect to given database.
       * @param {String|Array} url Either db URL or array of replica set URLs.
       * @return {Promise} which resolves to a database connection if successful.
       */
      value: function connect(url) {
        debug("connect to " + url);

        return new Q(function (resolve, reject) {
          var db = undefined;

          db = monk(url, function (err) {
            if (err) {
              reject(new Error("Failed to connect to db: " + err.message));
            } else {
              var instance = new Database(db);

              dbConnections.push(instance);

              resolve(instance);
            }
          });
        });
      },
      writable: true,
      configurable: true
    },
    closeAll: {


      /**
       * Close all opened db connections.
       * @return {Promise}
       */
      value: function closeAll() {
        debug("close all connections: " + dbConnections.length);

        return Q.map(dbConnections, function (db) {
          return db.close();
        }).then(function () {
          dbConnections = [];
        });
      },
      writable: true,
      configurable: true
    }
  });

  return Manager;
})();







module.exports = Manager;