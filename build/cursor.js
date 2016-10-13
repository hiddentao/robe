"use strict";


var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _ = require("lodash"),
    EventEmitter = require("eventemitter2").EventEmitter2,
    Q = require("bluebird");


var RobeUtils = require("./utils");



/**
 * Represents a cursor which streams results.
 *
 * A `result` event will be emitted for each result.
 * An `error` event will be emitted for any errors.
 * A `success` event will be emitted once cursor completes.
 */
var Cursor = (function (EventEmitter) {
  /**
   * Constructor.
   *
   * @param  {Collection} collection Collection being queried.
   * @param  {Promise} promise Promise returned from a monk `find()` call.
   * @param  {Object} [options] Additional options.
   * @param  {Boolean} [options.rawMode] Whether to enable raw query mode by default. Default is false.
   */
  function Cursor(collection, promise) {
    var options = arguments[2] === undefined ? {} : arguments[2];
    _classCallCheck(this, Cursor);

    _get(Object.getPrototypeOf(Cursor.prototype), "constructor", this).call(this);

    this.collection = collection;
    this.promise = promise;
    this.options = _.defaults(options, {
      rawMode: false
    });

    this._init();
  }

  _inherits(Cursor, EventEmitter);

  _prototypeProperties(Cursor, null, {
    _init: {


      /**
       * Initialize events.
       * @private
       */
      value: function _init() {
        var self = this;

        self.promise.then(function () {
          self.emit("end");
        });

        self.promise["catch"](function (err) {
          self.emit("error", err);
        });

        self.promise.each(function (doc, cursor) {
          self.cursor = cursor;

          doc = self.collection._createDocumentFromQueryResult(doc, self.options);

          self.emit("result", doc);
        });
      },
      writable: true,
      configurable: true
    },
    close: {


      /**
       * Close this cursor without waiting for it to finish.
       */
      value: function* close() {
        if (this.cursor && this.cursor.close) {
          this.cursor.close();
        }
      },
      writable: true,
      configurable: true
    }
  });

  return Cursor;
})(EventEmitter);





module.exports = Cursor;