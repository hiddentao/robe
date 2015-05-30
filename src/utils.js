"use strict";

/**
 * @fileOverview 
 *
 * This contains various utility methods used by the rest of Robe.
 */

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
