"use strict";


var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _ = require("lodash"),
    BSON = require("bson").BSONPure,
    debug = require("debug")("robe-oplog"),
    EventEmitter2 = require("eventemitter2").EventEmitter2,
    Class = require("class-extend"),
    Q = require("bluebird");


var Cursor = require("./cursor");


/**
 * Represents the oplog.
 */
var Oplog = (function (EventEmitter2) {
  /**
   * Constructor.
   *
   * @param  {Database} db The underlying db.
   */
  function Oplog(db) {
    _classCallCheck(this, Oplog);

    _get(Object.getPrototypeOf(Oplog.prototype), "constructor", this).call(this, {
      wildcard: true,
      delimiter: ":"
    });

    this.db = db;
    this.watchers = [];
  }

  _inherits(Oplog, EventEmitter2);

  _prototypeProperties(Oplog, null, {
    stop: {



      /**
       * Stop watching oplog.
       */
      value: function* stop() {
        debug("Stop oplog");

        yield this.cursor.close();

        this.emit("stopped");
      },
      writable: true,
      configurable: true
    },
    start: {



      /**
       * Start watching the oplog.
       *
       * @see  https://blog.compose.io/the-mongodb-oplog-and-node-js/
       */
      value: function* start() {
        // already started?
        if (this.cursor) {
          return;
        }

        debug("Start watching oplog");

        var oplog = this.db.get("oplog.rs");

        // get highest current timestamp
        var results = yield oplog.find({}, {
          fields: {
            ts: 1
          },
          sort: {
            $natural: -1
          },
          limit: 1
        });

        var lastOplogTime = _.deepGet(results, "0.ts");

        // if last ts not available then set to current time
        if (!lastOplogTime) {
          lastOplogTime = new BSON.Timestamp(0, Date.now() / 1000);
        }

        // Create a cursor for tailing and set it to await data
        var cursor = this.cursor = new Cursor(oplog, oplog.find({
          ts: {
            $gte: lastOplogTime
          }
        }, {
          tailable: true,
          awaitdata: true,
          oplogReplay: true,
          timeout: false,
          numberOfRetries: -1,
          stream: true }), {
          rawMode: true });

        cursor.on("error", _.bind(this.onError, this));
        cursor.on("success", _.bind(this.onFinished, this));
        cursor.on("result", _.bind(this.onData, this));

        this.emit("started");
      },
      writable: true,
      configurable: true
    },
    onError: {


      /**
       * Handle error
       */
      value: function onError(err) {
        debug("Oplog error: " + err.message);

        this.emit("error", err);
      },
      writable: true,
      configurable: true
    },
    onFinished: {


      /** 
       * Handle oplog stream finished.
       *
       * (We don't expect this to be called).
       */
      value: function onFinished() {
        debug("Oplog finished");

        this.emit("finished");
      },
      writable: true,
      configurable: true
    },
    onData: {


      /**
       * Handle new oplog data.
       */
      value: function onData(data) {
        console.log(data);

        if (data) {
          var opType = null;
          switch (data.op) {
            case "i":
              opType = "insert";
              break;
            case "d":
              opType = "delete";
              break;
            case "u":
              opType = "update";
              break;
            default:
              debug("Ignoring op: " + data.op);
              return;
          }

          var collectionName = data.ns.split(".").pop();

          this.emit([collectionName, opType], data.o);
        }
      },
      writable: true,
      configurable: true
    }
  });

  return Oplog;
})(EventEmitter2);




Oplog.extend = Class.extend;

module.exports = Oplog;