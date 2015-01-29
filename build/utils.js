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
    return new Document(collection, mongoDoc);
  }
};