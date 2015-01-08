"use strict";


var _ = require('lodash'),
  debug = require('debug')('robe-db'),
  Class = require('class-extend'),
  Q = require('bluebird');

var Model = require('./model');



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
    debug('close');

    if (2 === _.deepGet(this.db, 'driver._state')) {
      return Q.promisify(this.db.close, this.db)();
    } else {
      return Q.resolve();
    }
  }


  /**
   * Fetch a `Model` representing given collection in db.
   *
   * @param {Object} [options] Additional options.
   * @param {Object} [options.schema] Model schema.
   * 
   * @return {Model}
   */
  model (name, options) {
    return new Model(this.db.get(name), options);
  }
}

Database.extend = Class.extend;



module.exports = Database;
