"use strict";


var _ = require('lodash'),
  debug = require('debug')('robe-db'),
  Class = require('class-extend'),
  Q = require('bluebird');

var Collection = require('./collection'),
  Oplog = require('./oplog');



/**
 * Represents a database connection.
 */
class Database {
  /**
   * Constructor.
   * @param  {Object} db Mongoskin db connection.
   */
  constructor (db) {
    this.db = db;
  }


  /**
   * Get oplog watcher.
   *
   * This will create and start the watcher if not already done so.
   */
  * oplog () {
    if (!this._oplog) {
      this._oplog = new Oplog(this);
    }

    return this._oplog;
  }



  /**
   * Close this database connection.
   * @return {Promise}
   */
  close () {
    var self = this;
    
    debug('close');

    return Q.try(function() {
      if (self._oplog) {
        return self._oplog.stop();
      }
    })
      .then(function closeDb() {
        if (2 === _.deepGet(self.db, 'driver._state')) {
          return Q.promisify(self.db.close, self.db)();
        }
      });
  }


  /**
   * Fetch a collection from the db.
   *
   * @param {Object} [options] Additional options.
   * @param {Object} [options.schema] Collection schema.
   * 
   * @return {Collection}
   */
  collection (name, options = {}) {
    return new Collection(this, this.db.get(name), options);
  }

}

Database.extend = Class.extend;



module.exports = Database;
