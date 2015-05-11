"use strict";

var _ = require('lodash'),
  mongoskin = require('mongoskin');


var Document = require('./document');

/**
 * Convert given string to a Mongo `ObjectID` for querying with.
 * @see mongoskin
 */
exports.toObjectID = mongoskin.helper.toObjectID;


/**
 * Get whether given item represents a Mongo `ObjectID` object.
 * @param {*} item 
 * @return {Boolean} `true` if so; `false` otherwise.
 */
exports.isObjectID = function(item) {
  return (item instanceof mongoskin.ObjectID);
};



/**
 * Get whether given item represents a Mongo `ObjectID` string.
 * @param {*} item 
 * @return {Boolean} `true` if so; `false` otherwise.
 */
exports.isObjectIDStr = mongoskin.helper.isObjectID;



/**
 * Format Mongo document to be returned to a caller.
 *
 * @param {Collection} collection The collection to which this document belongs.
 * @param {Object} mongoDoc Mongo document returned as a query result.
 * @param {Object} [options] Additional options.
 * @param {Boolean} [options.rawMode] Whether to return the resulting raw document as-is. Overrides the default for the collection.
 * 
 * @return {Document|Object}
 *
 * @private
 */
exports.formatMongoDoc = function(collection, mongoDoc, options = {}) {
  if (options.rawMode || collection.options.rawMode) {
    return mongoDoc;
  } else {
    var d = new Document(collection, mongoDoc);

    for (let key in collection.options.docMethods) {
      let method = collection.options.docMethods[key];

      if (exports.isGen(method)) {
        d[key] = exports.bindGen(method, d);
      } else {
        d[key] = _.bind(method, d);
      }
    }

    return d;
  }
};




/**
 * Bind generator function to given context.
 * @param  {GeneratorFunction} genFn Generator function.
 * @param  {Object} ctx   Desired `this` context.
 * @return {GeneratorFunction}
 */
exports.bindGen = function(genFn, ctx) {
  return function*(...args) {
    return yield genFn.apply(ctx, args);
  };
};





/** 
 * Get whether given function is a generator function.
 *
 * @param {Function} fn A function.
 *
 * @return {Boolean} true if so; false otherwise.
 */
exports.isGen = function(fn) {
  var constructor = fn.constructor;

  if (!constructor) {
    return false;
  }

  if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) {
    return true;
  }

  return ('function' == typeof constructor.prototype.next && 'function' == typeof constructor.prototype.throw);
}
