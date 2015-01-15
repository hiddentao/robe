"use strict";


var _ = require('lodash'),
  compose = require('generator-compose'),
  debug = require('debug')('robe-collection'),
  Class = require('class-extend'),
  Q = require('bluebird'),
  schemaBuilder = require('simple-mongo-schema');


var Cursor = require('./cursor'),
  Document = require('./document'),
  RobeUtils = require('./utils');





/**
 * Represents a collection in the database.
 */
class Collection {
  /**
   * Constructor.
   *
   * @param  {Object} collection The underlying collection.
   * @param  {Object} [options] Additional options.
   * @param  {Object} [options.schema] Database schema.
   * @param  {Boolean} [options.raw] Whether to enable raw query mode by default. Default if false.
   */
  constructor (collection, options = {}) {
    this.options = _.defaults(options, {
      schema: {},
      raw: false,
    });

    this.schema = schemaBuilder(options.schema);

    this.collection = collection;

    Object.defineProperty(this, '_hooks', {
      value: {
        before: {
          insert: [],
          update: [],
          remove: [],
        },
        after: {
          insert: [],
          update: [],
          remove: [],
        }
      },
      enumerable: false
    });

    this._initDefaultHooks();
  }

  /**
   * Execute given handler before given event
   *
   * @param {String} eventName Name of event. One of `insert`, `remove`, `update`
   * @param {Function} genFn Generator function which takes a callback as a parameter.
   */
  before (eventName, genFn) {
    this._hooks.before[eventName].push(genFn);
  }

  /**
   * Execute given handler after given event
   *
   * @param {String} eventName Name of event. One of `insert`, `remove`, `update`
   * @param {Function} genFn Generator function which takes a callback as a parameter.
   */
  after (eventName, genFn) {
    this._hooks.after[eventName].push(genFn);
  }


  /**
   * Initialise default hooks.
   * @private
   */
  _initDefaultHooks () {
    var self = this;

    this.before('insert', function*(attrs, next) {
      self.schema.validate(attrs);

      yield next;
    });

    this.before('update', function*(search, update, next) {
      if (update.$set) {
        self.schema.validate(update.$set);
      }

      yield next;
    });
  }


  /**
   * Execute given hook
   * @param  {String} when Hook type.
   * @param  {String} eventName Hook event.
   * @param  {Array} [...] Parameters to pass to hook.
   *
   * @private
   */
  * _runHook (when, eventName) {
    var fn = compose(this._hooks[when][eventName]);

    yield fn.apply(this, Array.prototype.slice.call(arguments, 2));
  }


  /**
   * Insert a document.
   * 
   * @param  {Object} attrs The document attributes.
   * @param {Object} [options] Additional options.
   * @param {Boolean} [options.raw] Whether to return the resulting raw document as-is. Overrides the default for the collection.
   * @return {Document} the newly inserted document.
   */
  * insert (attrs, options) {
    yield this._runHook('before', 'insert', attrs);

    var res = yield this.collection.insert(attrs);

    yield this._runHook('after', 'insert', res);

    return RobeUtils.formatMongoDoc(this, res, options);
  }


  /**
   * Update documents.
   * 
   * @param {Object} [search] Filtering query.
   * @param  {Object} update The update to make.
   */
  * update (search = {}, update) {
    yield this._runHook('before', 'update', search, update);

    var ret = yield this.collection.update(search, update);

    yield this._runHook('after', 'update', search, update, ret);

    return ret;
  }


  /**
   * Remove documents.
   * 
   * @param {Object} [search] Filtering query.
   */
  * remove (search) {
    yield this._runHook('before', 'remove', search);

    var ret = yield this.collection.remove(search);

    yield this._runHook('after', 'remove', search, ret);

    return ret;
  }


  /**
   * Find documents from this collection.
   *
   * @param {Object} [selector] Filtering query.
   * @param {Object} [options] Query options.
   * @param {Object} [options.sort] Sort filter (Mongo syntax).
   * @param {Number} [options.skip] Number of records to skip at the beginning.
   * @param {Number} [options.limit] Max. no of records to return.
   * @param {Object} [options.fields] Fields to return or exclude (Mongo syntax).
   * @param {Boolean} [options.raw] Whether to return the resulting raw document as-is. Overrides the default for the collection.
   *
   * @return {Array} Results
   */
  * find (selector = {}, options = {}) {
    var self = this;

    var res = yield this.collection.find(selector, _.extend({}, options));

    return res.map( v => RobeUtils.formatMongoDoc(self, v, options) );
  }



  /**
   * Find a single document from this collection.
   *
   * @param {String|Object} selector ObjectId or filtering query.
   * @param {Object} [options] Query options.
   * @param {Object} [options.sort] Sort filter (Mongo syntax).
   * @param {Number} [options.skip] Number of records to skip at the beginning.
   * @param {Object} [options.fields] Fields to return or exclude (Mongo syntax).
   */
  * findOne (selector, options = {}) {
    var self = this;

    options.limit = 1;

    var results = yield this.collection.find(selector, options);

    return results.length ? RobeUtils.formatMongoDoc(self, results.pop(), options) : null;
  }




  /**
   * Stream documents from this collection.
   *
   * @param {Object} [selector] Filtering query.
   * @param {Object} [options] Query options.
   * @param {Object} [options.sort] Sort filter (Mongo syntax).
   * @param {Number} [options.skip] Number of records to skip at the beginning.
   * @param {Number} [options.limit] Max. no of records to return.
   * @param {Object} [options.fields] Fields to return or exclude (Mongo syntax).
   * @param {Boolean} [options.raw] Whether to return the resulting raw document as-is. Overrides the default for the collection.
   *
   * @return {Cursor} cursor object
   */
  * findStream (selector = {}, options = {}) {
    _.extend(options, {
      stream: true
    });

    return new Cursor(
      this.collection,
      this.collection.find(selector, options),
      options
    );
  }
}


Collection.extend = Class.extend;

module.exports = Collection;


