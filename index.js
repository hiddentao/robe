"use strict";

var _ = require('lodash');
_.mixin(require("lodash-deep"));


var Robe = module.exports = require('./build/manager');

Robe.Database = require('./build/database');

Robe.Collection = require('./build/collection');

Robe.Document = require('./build/document');

Robe.Cursor = require('./build/cursor');

Robe.Utils = require('./build/utils');
