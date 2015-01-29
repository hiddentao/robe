"use strict";


var _ = require('lodash'),
  debug = require('debug')('robe'),
  Class = require('class-extend'),
  Q = require('bluebird'),
  monk = require('monk'),
  Database = require('./database');



/**
 * All db connections.
 * @type {Array}
 */
var dbConnections = [];


/**
 * Overall database manager and entry point to Robe.
 */
class Manager {
  /**
   * Connect to given database.
   * @param {String|Array} url Either db URL or array of replica set URLs.
   * @param {Object} options Connection options.
   * @param {Number} options.timeout Connection timeout in milliseconds. Default is 5000.
   * @return {Promise} which resolves to a database connection if successful.
   */
  static connect (url, options = {}) {
    if (!Array.isArray(url)) {
      url = [url];
    }

    _.defaults(options, Manager.DEFAULT_CONNECTION_OPTIONS);

    debug('connect to ' + url.join(', '));

    let db = monk.apply(null, url);

    return new Q(function checkConnection(resolve, reject) {
      var connectionTimeout = setTimeout(function() {
        reject(new Error('Timed out connecting to db'));
      }, options.timeout);

      db.once('open', function() {
        clearTimeout(connectionTimeout);

        // until https://github.com/Automattic/monk/issues/24 is resolve we 
        // manually check, see http://stackoverflow.com/questions/27547979/db-connection-error-handling-with-monk 
        if (2 !== _.deepGet(db, 'driver._state')) {
          reject(new Error('Failed to connect to db'));
        } else {
          var instance = new Database(db);

          dbConnections.push(instance);

          resolve(instance);
        }
      });
    });
  }


  /**
   * Close all opened db connections.
   * @return {Promise}
   */
  static closeAll () {
    debug('close all connections');

    return Q.map(dbConnections, function(db) {
      return db.close();
    })
      .then(function() {
        dbConnections = [];
      });
  }
}

Manager.DEFAULT_CONNECTION_OPTIONS = {
  timeout: 3000
};

Manager.extend = Class.extend;



module.exports = Manager;
