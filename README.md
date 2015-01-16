**WORK IN PROGRESS - NOT YET READY**

```
Todo:
* Documentation
```

# Robe

[![Build Status](https://secure.travis-ci.org/hiddentao/robe.png?branch=master)](http://travis-ci.org/hiddentao/robe) [![NPM module](https://badge.fury.io/js/robe.png)](https://badge.fury.io/js/robe)

**Robe** wraps around [monk](https://github.com/Automattic/monk) to provide a 
simple yet effective ODM library for MongoDB. 

Features:

* Work with ODM-style documents or raw Mongo data - the choice is yours
* Replica sets supported
* Cursor mode (for streaming results)
* Optional schema validation ([simple-mongo-schema](https://github.com/hiddentao/simple-mongo-schema)).

## Examples

More fully-fledges and beautiful documentation is available at [https://hiddentao.github.io/robe](https://hiddentao.github.io/robe).

```js
"use strict";

var robe = require('robe');

// connect to db
var db = yield robe.connect('127.0.0.1');

// get a collection
var collection = db.collection('test');

// insert a record
var item = yield collection.insert({
  name: 'jim',
  age: 23
});

console.log(Object.keys(item)); // _id, name, age

// update
item.age = 54;
yield item.save();

// remove
yield item.remove();
```

## Building

To run the tests:

    $ npm install -g gulp
    $ npm install
    $ npm test

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](https://github.com/hiddentao/robe/blob/master/CONTRIBUTING.md).

## Inspiration and thanks

* [mongoose](http://mongoosejs.com)
* [mongorito](http://mongorito.com/)
* [Meteor](docs.meteor.com/#/full/collections)

## License

MIT - see [LICENSE.md](https://github.com/hiddentao/robe/blob/master/LICENSE.md)


