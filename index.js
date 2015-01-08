"use strict";

require('6to5/register')({
  blacklist: ['generators']
});

var _ = require('lodash');
_.mixin(require("lodash-deep"));


module.exports = require('./lib/manager');
