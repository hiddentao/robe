"use strict";


var _ = require('lodash'),
  BSON = require('bson').BSONPure,
  debug = require('debug')('robe-oplog'),
  EventEmitter2 = require('eventemitter2').EventEmitter2,
  Class = require('class-extend'),
  Q = require('bluebird');


var Cursor = require('./cursor');


/**
 * Represents the oplog.
 */
class Oplog extends EventEmitter2 {
  /**
   * Constructor.
   *
   * @param  {Database} db The underlying db.
   */
  constructor (db) {
    super({
      wildcard: true,
      delimiter: ':'
    });

    this.db = db;
    this.watchers = [];
  }



  /**
   * Stop watching oplog.
   */
  * stop () {
    debug('Stop oplog');

    yield this.cursor.close();

    this.emit('stopped');
  }



  /**
   * Start watching the oplog.
   *
   * @see  https://blog.compose.io/the-mongodb-oplog-and-node-js/
   */
  * start () {
    // already started?
    if (this.cursor) {
      return;
    }

    debug('Start watching oplog');

    var oplog = this.db.get('oplog.rs');

    // get highest current timestamp
    var results = yield oplog.find({}, {
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
        numberOfRetries: -1,
        stream: true,
      }),
      {
        rawMode: true,
      }
    );

    cursor.on('error', _.bind(this.onError, this));
    cursor.on('success', _.bind(this.onFinished, this));
    cursor.on('result', _.bind(this.onData, this));

    this.emit('started');
  }  


  /**
   * Handle error
   */
  onError (err) {
    debug('Oplog error: ' + err.message);

    this.emit('error', err);
  }


  /** 
   * Handle oplog stream finished.
   *
   * (We don't expect this to be called).
   */
  onFinished () {
    debug('Oplog finished');

    this.emit('finished');
  }


  /**
   * Handle new oplog data.
   */
  onData (data) {
    console.log(data);
    
    if (data) {
      var opType = null;
      switch (data.op) {
        case 'i':
          opType = 'insert';
          break;
        case 'd':
          opType = 'delete';
          break;
        case 'u':
          opType = 'update';
          break;
        default:
          debug('Ignoring op: ' + data.op);
          return;
      }

      var collectionName = data.ns.split('.').pop();

      this.emit([collectionName, opType], data.o);
    }
  }
}


Oplog.extend = Class.extend;

module.exports = Oplog;


