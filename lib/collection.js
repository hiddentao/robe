"use strict";


var _ = require('lodash'),
  compose = require('generator-compose'),
  debug = require('debug')('robe-collection'),
  Class = require('class-extend'),
  Q = require('bluebird'),
  schemaBuilder = require('simple-mongo-schema');

var Document = require('./document');



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
   */
  constructor (collection, options = {}) {
    _.defaults(options, {
      schema: {}
    });

    this.collection = collection;
    this.schema = schemaBuilder(options.schema);

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

    this.before('insert', this.validateSchemaInsert);
    this.before('update', this.validateSchemaUpdate);
  }

  /**
   * Execute given handler before given event
   *
   * @param {String} eventName Name of event. One of `insert`, `remove`, `update`
   * @param {Function} genFn Generator function which takes a callback as a parameter.
   */
  before (eventName, genFn) {
    this._hook.before[eventName].push(genFn);
  }

  /**
   * Execute given handler after given event
   *
   * @param {String} eventName Name of event. One of `insert`, `remove`, `update`
   * @param {Function} genFn Generator function which takes a callback as a parameter.
   */
  after (eventName, genFn) {
    this._hook.after[eventName].push(genFn);
  }



  /**
   * Execute given hook
   * @param  {String} when Hook type.
   * @param  {String} eventName Hook event.
   * @param  {Array} [data] Arguments to pass to hook.
   */
  * _runHook (when, eventName, ...data) {
    var fn = compose(this._hooks[when][eventName]);

    yield fn.apply(this, data);
  }



  /**
   * Insert a document.
   * 
   * @param  {Object} attrs The document attributes.
   * @return {Document} the newly inserted document.
   */
  * insert (attrs) {
    yield this._runHook('before', 'insert', attrs);

    var res = yield this.collection.insert(attrs);

    yield this._runHook('after', 'insert', res);

    return new Document(this, res);
  }


  /**
   * Update documents.
   * 
   * @param {Object} [search] Filtering query.
   * @param  {Object} update The update to make.
   */
  * update (search, update) {
    yield this._runHook('before', 'update', attrs);

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
   */
  * find (selector, options = {}) {
    var self = this;

    var results = yield this.collection.find(selector, options);

    return results.map(v => new Document(self, v));
  }


  /**
   * Find a single document from this collection.
   *
   * @param {Object} [selector] Filtering query.
   * @param {Object} [options] Query options.
   * @param {Object} [options.sort] Sort filter (Mongo syntax).
   * @param {Number} [options.skip] Number of records to skip at the beginning.
   * @param {Object} [options.fields] Fields to return or exclude (Mongo syntax).
   */
  * findOne (selector, options = {}) {
    var self = this;

    options.limit = 1;

    var results = yield this.collection.find(selector, options);

    return results.length ? results.pop() : null;
  }
}


Collection.extend = Class.extend;

module.exports = Collection;


