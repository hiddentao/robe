"use strict";


var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _ = require("lodash"),
    compose = require("generator-compose"),
    Class = require("class-extend"),
    Q = require("bluebird"),
    schemaBuilder = require("simple-mongo-schema");


var Cursor = require("./cursor"),
    Document = require("./document"),
    RobeUtils = require("./utils");



/**
 * Represents a collection in the database.
 */
var Collection = (function () {
  /**
   * Constructor.
   *
   * @param  {Object} db Underlying database connection.
   * @param  {Object} collection The underlying collection.
   * @param  {Object} options Additional options.
   * @param  {Object} [options.schema] Database schema.
   * @param  {Array} [options.indexes] Database indexex to setup.
   * @param  {Boolean} [options.rawMode] Whether to enable raw query mode by default. Default if false.
   * @param  {Object} [options.methods] Convenience methods to make available on this collection instance. Each method is specified as a `name`:`function *` pair.
   * @param  {Object} [options.docMethods] Convenience methods to make available on this collection's `Document` instances. Each method is specified as a `name`:`function *` pair.
   */
  function Collection(db, collection) {
    var options = arguments[2] === undefined ? {} : arguments[2];
    _classCallCheck(this, Collection);

    this.db = db;

    this.options = _.defaults(options, {
      schema: {},
      rawMode: false,
      docMethods: {} });

    this.schema = schemaBuilder(options.schema);
    this.indexes = options.indexes || [];

    this.collection = collection;

    Object.defineProperty(this, "_hooks", {
      value: {
        before: {
          insert: [],
          update: [],
          remove: [] },
        after: {
          insert: [],
          update: [],
          remove: [] }
      },
      enumerable: false
    });

    // methods
    for (var _name in options.methods || {}) {
      var method = options.methods[_name];

      if (RobeUtils.isGen(method)) {
        this[_name] = RobeUtils.bindGen(method, this);
      } else {
        this[_name] = _.bind(method, this);
      }
    }
  }

  _prototypeProperties(Collection, null, {
    ensureIndexes: {


      /**
       * Ensure all configured indexes exist in the database.
       *
       * This looks through the indexes supplied during construction and sets them 
       * up.
       */
      value: function* ensureIndexes() {
        var self = this;

        yield Q.map(this.indexes, function (idx) {
          return self.collection.ensureIndex(idx.fields, idx.options || {});
        });
      },
      writable: true,
      configurable: true
    },
    before: {


      /**
       * Execute given handler before given event
       *
       * @param {String} eventName Name of event. One of `insert`, `remove`, `update`
       * @param {Function} genFn Generator function which takes a callback as a parameter.
       */
      value: function before(eventName, genFn) {
        this._hooks.before[eventName].push(genFn);
      },
      writable: true,
      configurable: true
    },
    after: {

      /**
       * Execute given handler after given event
       *
       * @param {String} eventName Name of event. One of `insert`, `remove`, `update`
       * @param {Function} genFn Generator function which takes a callback as a parameter.
       */
      value: function after(eventName, genFn) {
        this._hooks.after[eventName].push(genFn);
      },
      writable: true,
      configurable: true
    },
    _runHook: {



      /**
       * Execute given hook
       * @param  {String} when Hook type.
       * @param  {String} eventName Hook event.
       * @param  {Array} [args] Parameters to pass to hook.
       *
       * @private
       */
      value: function* _runHook(when, eventName) {
        for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          args[_key - 2] = arguments[_key];
        }

        var fn = compose(this._hooks[when][eventName]);

        yield fn.apply(this, args);
      },
      writable: true,
      configurable: true
    },
    insert: {


      /**
       * Insert a document.
       * 
       * @param  {Object} attrs The document attributes.
       * @param {Object} [options] Additional options.
       * @param {Boolean} [options.rawMode] Whether to return the resulting raw document as-is. Overrides the default for the collection.
       * @return {Document} the newly inserted document.
       */
      value: function* insert(attrs, options) {
        yield this._runHook("before", "insert", attrs);

        // validate against schema
        yield this.schema.validate(attrs);

        var res = yield this.collection.insert(attrs);

        yield this._runHook("after", "insert", res);

        return this._createDocumentFromQueryResult(res, options);
      },
      writable: true,
      configurable: true
    },
    update: {


      /**
       * Update documents.
       * 
       * @param {Object} [search] Filtering query.
       * @param  {Object} update The update to make.
       */
      value: function* update(_x, update) {
        var search = arguments[0] === undefined ? {} : arguments[0];
        yield this._runHook("before", "update", search, update);

        // validate against schema
        if (update.$set) {
          yield this.schema.validate(update.$set, {
            ignoreMissing: true
          });
        } else {
          yield this.schema.validate(update, {
            ignoreMissing: false
          });
        }

        var ret = yield this.collection.update(search, update);

        yield this._runHook("after", "update", search, update, ret);

        return ret;
      },
      writable: true,
      configurable: true
    },
    remove: {


      /**
       * Remove documents.
       * 
       * @param {Object} [search] Filtering query.
       */
      value: function* remove(search) {
        yield this._runHook("before", "remove", search);

        var ret = yield this.collection.remove(search);

        yield this._runHook("after", "remove", search, ret);

        return ret;
      },
      writable: true,
      configurable: true
    },
    find: {


      /**
       * Find documents from this collection.
       *
       * @param {Object} [selector] Filtering query.
       * @param {Object} [options] Query options.
       * @param {Object} [options.sort] Sort filter (Mongo syntax).
       * @param {Number} [options.skip] Number of records to skip at the beginning.
       * @param {Number} [options.limit] Max. no of records to return.
       * @param {Object} [options.fields] Fields to return or exclude (Mongo syntax).
       * @param {Boolean} [options.rawMode] Whether to return the resulting raw document as-is. Overrides the default for the collection.
       *
       * @return {Array} Results
       */
      value: function* find() {
        var selector = arguments[0] === undefined ? {} : arguments[0];
        var options = arguments[1] === undefined ? {} : arguments[1];
        var self = this;

        var res = yield this.collection.find(selector, _.extend({}, options));

        return res.map(function (v) {
          return self._createDocumentFromQueryResult(v, options);
        });
      },
      writable: true,
      configurable: true
    },
    count: {



      /**
       * Count documents in this collection.
       *
       * @param {Object} [selector] Filtering query.
       *
       * @return {Array} Results
       */
      value: function* count() {
        var selector = arguments[0] === undefined ? {} : arguments[0];
        return yield this.collection.count(selector);
      },
      writable: true,
      configurable: true
    },
    findOne: {



      /**
       * Find a single document from this collection.
       *
       * @param {String|Object} selector ObjectId or filtering query.
       * @param {Object} [options] Query options.
       * @param {Object} [options.sort] Sort filter (Mongo syntax).
       * @param {Number} [options.skip] Number of records to skip at the beginning.
       * @param {Object} [options.fields] Fields to return or exclude (Mongo syntax).
       */
      value: function* findOne(selector) {
        var options = arguments[1] === undefined ? {} : arguments[1];
        var self = this;

        options.limit = 1;

        var results = yield this.collection.find(selector, options);

        return results.length ? this._createDocumentFromQueryResult(results.pop(), options) : null;
      },
      writable: true,
      configurable: true
    },
    findStream: {




      /**
       * Stream documents from this collection.
       *
       * @param {Object} [selector] Filtering query.
       * @param {Object} [options] Query options.
       * @param {Object} [options.sort] Sort filter (Mongo syntax).
       * @param {Number} [options.skip] Number of records to skip at the beginning.
       * @param {Number} [options.limit] Max. no of records to return.
       * @param {Object} [options.fields] Fields to return or exclude (Mongo syntax).
       * @param {Boolean} [options.rawMode] Whether to return the resulting raw document as-is. Overrides the default for the collection.
       *
       * @return {Cursor} cursor object
       */
      value: function* findStream() {
        var selector = arguments[0] === undefined ? {} : arguments[0];
        var options = arguments[1] === undefined ? {} : arguments[1];
        _.extend(options, {
          stream: true
        });

        return new Cursor(this, this.collection.find(selector, options), options);
      },
      writable: true,
      configurable: true
    },
    addWatcher: {


      /**
       * Add watcher to this collection's oplog tailing cursor.
       *
       * The Mongo oplog will be observed for changes to this collection. If 
       * something happens the callback will be invoked.
       *
       * @param {Function} callback Callback to add to observers list.
       * @see Robe.Oplog
       */
      value: function* addWatcher(callback) {
        (yield this.db.oplog()).on(this.collection.name + ":*", callback);
      },
      writable: true,
      configurable: true
    },
    removeWatcher: {



      /**
       * Remove watcher from this collection's oplog tailing cursor.
       *
       * @param {Function} callback Callback to remove from the observers list.
       */
      value: function* removeWatcher(callback) {
        (yield this.db.oplog()).off(this.collection.name + ":*", callback);
      },
      writable: true,
      configurable: true
    },
    _createDocument: {



      /**
       * Create Mongo document from given raw object.
       *
       * @param {Object} mongoDoc Mongo document returned as a query result.
       * 
       * @return {Document|Object}
       *
       * @private
       */
      value: function _createDocument(mongoDoc) {
        var d = new Document(this, mongoDoc);

        for (var key in this.options.docMethods) {
          var method = this.options.docMethods[key];

          if (RobeUtils.isGen(method)) {
            d[key] = RobeUtils.bindGen(method, d);
          } else {
            d[key] = _.bind(method, d);
          }
        }

        return d;
      },
      writable: true,
      configurable: true
    },
    _createDocumentFromQueryResult: {



      /**
       * Create Mongo document from given raw object returned by query.
       *
       * @param {Object} mongoDoc Mongo document returned as a query result.
       * @param {Object} [options] Additional options.
       * @param {Boolean} [options.rawMode] Whether to return the resulting raw document as-is. Overrides the default for the collection.
       * 
       * @return {Document|Object}
       *
       * @private
       */
      value: function _createDocumentFromQueryResult(mongoDoc) {
        var options = arguments[1] === undefined ? {} : arguments[1];
        if (options.rawMode || this.options.rawMode) {
          return mongoDoc;
        } else {
          return this._createDocument(mongoDoc);
        }
      },
      writable: true,
      configurable: true
    }
  });

  return Collection;
})();




Collection.extend = Class.extend;

module.exports = Collection;