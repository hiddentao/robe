"use strict";


var _ = require('lodash'),
  Q = require('bluebird'),
  monk = require('monk');



class Robe {
  /**
   * Connect to given database.
   * @param {String|Array} url Either db URL or array of replica set URLs.
   * @param {Object} options Connection options.
   * @param {Number} options.timeout Connection timeout in milliseconds. Default is 5000.
   * @return {Promise} which resolves to a database connection if successful.
   */
  static connect (url, options) {
    if (!Array.isArray(url)) {
      url = [url];
    }

    options = _.extend({
      timeout: 5000
    }, options);

    let db = monk.apply(null, url);

    return new Q(function checkConnection(resolve, reject) {

      var connectionTimeout = setTimeout(function() {
        reject(new Error('Timed out connecting to db'));
      }, options.timeout);

      db.once('open', function() {
        clearTimeout(connectionTimeout);

        // until https://github.com/Automattic/monk/issues/24 is resolve we 
        // manually check, see http://stackoverflow.com/questions/27547979/db-connection-error-handling-with-monk 
        if (2 !== db._native._state) {
          reject(new Error('Failed to connect to db'));
        } else {
          resolve(new Database(db));
        }
      });

    });
  }
}


/**
 * Represents a database connection.
 */
class Database {
  /**
   * Constructor.
   * @param  {Object} db Mongoskin db connection.
   */
  constructor: function(db) {
    this.db = db;
  }
}



