"use strict";


var _ = require('lodash'),
  BSON = require('bson').BSONPure
  debug = require('debug')('robe-oplog'),
  Class = require('class-extend'),
  Q = require('bluebird');


var Cursor = require('./cursor');


/**
 * Represents the oplog.
 */
class Oplog {
  /**
   * Constructor.
   *
   * @param  {Database} db The underlying db.
   */
  constructor (db) {
    this.db = db;
    this.watchers = [];
  }



  /**
   * Register given callback as an oplog watcher.
   *
   * This will notify the given callback when data gets 
   * changed, either through this or other MongoDB connections.
   *
   * @param {String} collectionName Name of collection to watch.
   * @param {Function} callback Callback to notify when a change occurs.
   */
  watch (collectionName, callback) {
    this._setupOplog();

    if (!this.watchers[collectionName]) {
      this.watchers[collectionName] = [];
    }

    this.watchers[collectionName].push(callback);

    this._start();
  }


  /**
   * De-register given callback as an oplog watcher.
   * 
   * @param {String} collectionName Name of collection to watch.
   * @param {Function} callback Callback to notify when a change occurs.
   */
  unwatch (collectionName, callback) {
    if (this.watchers[collectionName]) {
      this.watchers[collectionName] = 
        _.remove(this.watchers[collectionName], (v) => (v === callback) );
    }
  }



  /**
   * Stop all oplog watchers.
   */
  * stop () {
    if (this.cursor) {
      yield this.cursor.close();
      this._cleanup();
    }
  }



  /**
   * Start watching the oplog.
   *
   * @see  https://blog.compose.io/the-mongodb-oplog-and-node-js/
   */
  _start () {
    // already started?
    if (this.cursor) {
      return;
    }

    debug('Start watching oplog');

    var oplog = this.db.get('oplog.rs');

    // get highest current timestamp
    results = yield oplog.find({}, {
      fields: { 
        ts: 1
      },
      sort: {
        '$natural': -1
      },
      limit: 1
    });

    var lastOplogTime = _.deepGet(results, '0.ts');

    // if last ts not available then set to current time
    if (!lastOplogTime) {
      lastOplogTime = new BSON.Timestamp(0, Date.now() / 1000);
    }

    // Create a cursor for tailing and set it to await data
    var cursor = this.cursor = new Cursor(
      oplog,
      oplog.find({
        ts: {
          $gte: lastOplogTime
        }
      }, {
        tailable: true,
        awaitdata: true,
        oplogReplay: true,
        timeout: false,
        numberOfRetries: -1
      }),
      {
        raw: true
      }
    );

    cursor.on('error', _.bind(this.onError, this));
    cursor.on('success', _.bind(this.onFinished, this));
    cursor.on('result', _.bind(this.onData, this));
  }  


  /**
   * Reset internal variables.
   */
  _cleanup () {
    this.cursor = null;
    this.watchers = [];
  }


  onError (err) {
    console.error('Oplog error');
    console.error(err.stack);
  }


  onFinished () {
    this._cleanup();
  }


  onData (data) {
    console.dir(data);
  }
}


Oplog.extend = Class.extend;

module.exports = Oplog;


