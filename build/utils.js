"use strict";



var Document = require("./document");



/**
 * Format Mongo document to be returned to a caller.
 *
 * @param {Collection} collection The collection to which this document belongs.
 * @param {Object} mongoDoc Mongo document returned as a query result.
 * @param {Object} [options] Additional options.
 * @param {Boolean} [options.raw] Whether to return the resulting raw document as-is. Overrides the default for the collection.
 * 
 * @return {Document|Object}
 *
 * @private
 */
exports.formatMongoDoc = function (collection, mongoDoc) {
  var options = arguments[2] === undefined ? {} : arguments[2];
  if (options.raw || collection.options.raw) {
    return mongoDoc;
  } else {
    var d = new Document(collection, mongoDoc);

    for (var key in collection.options.docMethods) {
      d[key] = exports.bindGen(collection.options.docMethods[key], d);
    }

    return d;
  }
};




/**
 * Bind generation function to given context.
 * @param  {GeneratorFunction} genFn Generator function.
 * @param  {Object} ctx   Desired `this` context.
 * @return {GeneratorFunction}
 */
exports.bindGen = function (genFn, ctx) {
  return function* () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return yield genFn.apply(ctx, args);
  };
};