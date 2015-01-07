"use strict";


var _ = require('lodash'),
  Q = require('bluebird');



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
   * Close this database connection.
   * @return {Promise}
   */
  close () {
    if (2 === _.deepGet(this.db, 'driver._state')) {
      return Q.promisify(this.db.close, this.db)();
    } else {
      return Q.resolve();
    }
  }

}



module.exports = Database;