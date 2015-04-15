"use strict";


var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _ = require("lodash"),
    Class = require("class-extend"),
    EventEmitter = require("events").EventEmitter,
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
   * @param  {Boolean} [options.raw] Whether to enable raw query mode by default. Default if false.
   */
  function Cursor(collection, promise) {
    var options = arguments[2] === undefined ? {} : arguments[2];
    _classCallCheck(this, Cursor);

    this.collection = collection;
    this.promise = promise;
    this.options = options;

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

        self.promise.on("each", function (doc) {
          doc = RobeUtils.formatMongoDoc(self.collection, doc);

          self.emit("result", doc);
        });

        self.promise.on("error", function (err) {
          self.emit("error", err);
        });

        self.promise.on("success", function () {
          self.emit("success");
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
        var self = this;

        yield new Q(function (resolve, reject) {
          self.once("success", resolve);

          self.promise.destroy();
        });
      },
      writable: true,
      configurable: true
    }
  });

  return Cursor;
})(EventEmitter);




Cursor.extend = Class.extend;

module.exports = Cursor;