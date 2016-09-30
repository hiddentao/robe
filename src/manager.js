"use strict";


var _ = require('lodash'),
  debug = require('debug')('robe'),
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
   * @return {Promise} which resolves to a database connection if successful.
   */
  static connect (url) {
    debug('connect to ' + url);

    return new Q((resolve, reject) => {
      let db;
      
      db = monk(url, function(err) {
        if (err) {
          reject(new Error(`Failed to connect to db: ${err.message}`));
        } else {
          let instance = new Database(db);
          
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
    debug('close all connections: ' + dbConnections.length);

    return Q.map(dbConnections, function(db) {
      return db.close();
    })
      .then(function() {
        dbConnections = [];
      });
  }
}





module.exports = Manager;
