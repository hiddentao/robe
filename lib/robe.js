"use strict";


var _ = require('lodash'),
  Q = require('bluebird'),
  monk = require('monk'),
  Database = require('./database');

_.mixin(require("lodash-deep"));


/**
 * All db connections.
 * @type {Array}
 */
var dbConnections = [];


class Robe {
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

    _.defaults(options, {
      timeout: 5000
    });

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
          dbConnections.push(db);

          resolve(new Database(db));
        }
      });

    });
  }


  /**
   * Close all opened db connections.
   * @return {Promise}
   */
  static closeAll () {
    return Q.map(dbConnections, function(db) {
      if (2 === _.deepGet(db, 'driver._state')) {
        return Q.promisify(db.close, db)();
      } else {
        return Q.resolve();
      }
    });
  }
}





module.exports = Robe;
