"use strict";

require('6to5/register')({
  blacklist: ['generators']
});

var _ = require('lodash');
_.mixin(require("lodash-deep"));


var Robe = module.exports = require('./lib/manager');

Robe.Database = require('./lib/database');

Robe.Collection = require('./lib/collection');

Robe.Document = require('./lib/document');

Robe.Cursor = require('./lib/cursor');

Robe.Utils = require('./lib/utils');
