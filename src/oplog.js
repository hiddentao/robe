"use strict";


var _ = require('lodash'),
  mongo = require('mongoskin'),
  BSON = require('bson'),
  debug = require('debug')('robe-oplog'),
  EventEmitter2 = require('eventemitter2').EventEmitter2,
  Class = require('class-extend'),
  Q = require('bluebird');



/**
 * Represents the oplog.
 */
class Oplog extends EventEmitter2 {
  /**
   * Constructor.
   *
   * @param  {Database} robeDb The underlying db.
   */
  constructor (robeDb) {
    super({
      wildcard: true,
      delimiter: ':'
    });

    this.watchers = [];

    var self = this;
    ['_onData', '_onError', '_onEnded'].forEach(function(m) {
      self[m] = _.bind(self[m], self);
    })

    // find out master server
    var serverConfig = robeDb.db.driver._native.serverConfig;

    this.masterServer = _.find(serverConfig.servers || [], function(s) {
      return _.deepGet(s, 'isMasterDoc.ismaster');
    });

    if (!this.masterServer) {
      throw new Error('No MASTER server found for oplog');
    }
    
    this.hostPort = this.masterServer.host + ':' + this.masterServer.port;
    debug('db: ' + this.hostPort);
  }



  /**
   * Stop watching oplog.
   *
   * @return {Promise}
   */
  stop () {
    var self = this;

    debug('Stop oplog');

    return self.cursor.close()
      .then(function() {
        self.cursor = null;

        if (self.db) {
          debug('Close db connection');

          return new Q(function(resolve, reject){
            self.db.close(function(err) {
              if (err) return reject(err);

              resolve();
            }); 
          });
        }
      })
      .then(function() {
        self.emit('stopped');
      });
  }


  /**
   * Connect to master server.
   * @return {Promise}
   */
  _connectToServer () {
    var self = this;

    return Q.try(function() {
      if (self.db) {
        return;
      } else {
        debug('Connect to db ' + self.hostPort);

        self.db = mongo.db("mongodb://"  + self.hostPort + "/local", {
          native_parser:true
        });

        return new Q(function(resolve, reject) {
          self.db.open(function(err) {
            if (err) return reject(err);

            resolve();
          });
        });
      }
    });
  }



  /**
   * Start watching the oplog.
   *
   * @see  https://blog.compose.io/the-mongodb-oplog-and-node-js/
   *
   * @return {Promise}
   */
  start () {
    var self = this;

    // already started?
    if (self.cursor) {
      return Q.resolve();
    }

    return self._connectToServer()
      .then(function() {
        debug('Start watching oplog');

        var oplog = self.db.collection('oplog.rs');

        Q.promisifyAll(oplog);

        // get highest current timestamp
        return oplog.findAsync({}, {
          fields: { 
            ts: 1
          },
          sort: {
            '$natural': -1
          },
          limit: 1
        })
          .then(function(results) {
            var lastOplogTime = _.deepGet(results, '0.ts');

            // if last ts not available then set to current time
            if (!lastOplogTime) {
              lastOplogTime = new BSON.Timestamp(0, Math.floor(Date.now() / 1000 - 1));
            }

            debug('Watching for events newer than ' + lastOplogTime.toString());

            // use oplog.col._native to access lower-level native collection object
            var cursor = self.cursor = oplog.find({
              ts: {
                $gte: lastOplogTime
              }
            }, {
              tailable: true,
              awaitdata: true,
              oplogReplay: true,
              numberOfRetries: -1,
            });

            var stream = self.cursor.stream();

            stream.on('data', self._onData);
            stream.on('error', self._onError);
            stream.on('end', self._onEnded);

            debug('Cursor started');

            self.emit('started');
          });
      });
  }  


  /**
   * Handle error
   */
  _onError (err) {
    debug('Cursor error: ' + err.message);

    this.emit('error', err);
  }


  /** 
   * Handle oplog stream ended.
   *
   * (We don't expect this to be called).
   */
  _onEnded () {
    var self = this;

    debug('Cursor ended, restarting after 1s');

    this.cursor = null;

    Q.delay(1000)
      .then(function() {
        self.start();
      });
  }


  /**
   * Handle new oplog data.
   */
  _onData (data) {
    debug('Cursor data: ' + JSON.stringify(data));
    
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


