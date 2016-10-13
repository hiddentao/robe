"use strict";


var _ = require('lodash'),
  EventEmitter = require('eventemitter2').EventEmitter2,
  Q = require('bluebird')


var RobeUtils = require('./utils');



/**
 * Represents a cursor which streams results.
 *
 * A `result` event will be emitted for each result.
 * An `error` event will be emitted for any errors.
 * A `success` event will be emitted once cursor completes.
 */
class Cursor extends EventEmitter {
  /**
   * Constructor.
   *
   * @param  {Collection} collection Collection being queried.
   * @param  {Promise} promise Promise returned from a monk `find()` call.
   * @param  {Object} [options] Additional options.
   * @param  {Boolean} [options.rawMode] Whether to enable raw query mode by default. Default is false.
   */
  constructor (collection, promise, options = {}) {
    super();
    
    this.collection = collection;
    this.promise = promise;
    this.options = _.defaults(options, {
      rawMode: false
    });

    this._init();
  }


  /**
   * Initialize events.
   * @private
   */
  _init () {
    var self = this;

    self.promise.then(() => {
      self.emit('end');
    });
    
    self.promise.catch((err) => {
      self.emit('error', err);
    });

    self.promise.each((doc, cursor) => {
      self.cursor = cursor;
      
      doc = self.collection._createDocumentFromQueryResult(doc, self.options);

      self.emit('result', doc);      
    });
  }


  /**
   * Close this cursor without waiting for it to finish.
   */
  * close () {
    if (this.cursor && this.cursor.close) {
      this.cursor.close();        
    }
  }
}



module.exports = Cursor;


