# Robe

[![Build Status](https://travis-ci.org/hiddentao/robe.svg?branch=master)](http://travis-ci.org/hiddentao/robe) [![NPM module](https://badge.fury.io/js/robe.png)](https://badge.fury.io/js/robe)

**Robe** wraps around [monk](https://github.com/Automattic/monk) to provide a 
simple yet effective ODM library for MongoDB. 

Features:

* Work with ODM-style documents or raw Mongo data - the choice is yours
* Add before and after hooks for inserts, updates and removals
* Cursor mode (for streaming results)
* Schema validation ([simple-mongo-schema](https://github.com/hiddentao/simple-mongo-schema)).
* Indexes and replica sets supported
* Mongo oplog tailing (like you get in Meteor)
* [and more...](https://hiddentao.github.io/robe)


## Installation

**This package requires ES6 support, i.e. Node 0.11.2+**

```bash
$ npm install robe
```

## Examples

Detailed documentation is available at [https://hiddentao.github.io/robe](https://hiddentao.github.io/robe).

**The basics**

```js
"use strict";

var Robe = require('robe');

// connect to db
var db = yield Robe.connect('127.0.0.1');

// get a collection
var collection = db.collection('test');

// insert a record
yield collection.insert({
  name: 'jim',
  age: 23
});

// find it
var item = yield collection.findOne({
  name: 'jim'
});

console.log(item instanceof Robe.Document); // true
console.log(Object.keys(item)); // _id, name, age

// update
item.age = 54;
yield item.save();    // internally calls collection.update(...)

// remove
yield item.remove();  // internally calls collection.remove(...)
```

**Raw querying mode**

In this mode we won't make use of `Robe.Document` and will instead deal 
directly with Mongo data objects.

```js
// insert a record
yield collection.insert({
  name: 'jim',
  age: 23
});

// find it
var item = yield collection.findOne({
  name: 'jim'
}, {
  rawMode: true // return the raw mongo object
});

console.log(item instanceof Robe.Document); // false
console.log(Object.keys(item)); // _id, name, age

// update
yield collection.update({
  _id: item._id
}, {
  $set: {
    age: 54
  }
});

// remove
yield collection.remove({
  _id: item._id
});
```

You can also enable `rawMode` querying at the collection level:

```js
var collection = db.collection('test', {
  rawMode: true
});

yield collection.findOne({
  name: 'john'
}, {
  rawMode: false  // override the collection-level setting
});
```

**Hooks**

You can add multiple `before` and `after` hooks for insertions, updates and 
removals. Hooks get triggered even when calling the `save()` and `remove()` 
methods on a `Robe.Document` instance.

```js
collection.before('remove', function*(search, next) {
  console.log('Before hook');

  search.age = 54;  

  console.log(JSON.stringify(search));

  yield next;
});

collection.after('remove', function*(search, result, next) {
  console.log('After hook: ' + result);

  yield next;
});

// remove
yield collection.remove({
  name: 'john'
});

/*
Ouptut:
 
 Before hook
 { name: 'john', age: 54 }
 After hook: 1
*/
```

**Schema validation**

Schema definitions are as supported by [simple-mongo-schema](https://github.com/hiddentao/simple-mongo-schema). 
Inserts and updates trigger schema validation checks. Any keys not specified in the schema 
get ignored during validation, i.e. a schema can be a partial definition of a document.

```js
// get a collection
var collection = db.collection('test', {
  schema: {
    name: {
      type: String
    },
    isMarried: {
      type: Boolean
    },
    numCars: {
      type: Number
    },
  }  
});

// insert a record
try {
  yield collection.insert({
    name: 'jim',
    hasKids: true,
    isMarried: 'yes',
    numCars: '20'
  });
} catch (err) {

  console.log(err);

  /*
    Error: Validation failed
  */


  console.log(err.failures); 

  /*
    [
      "/isMarried: must be true or false",
      "/numCars: must be a number",
    ]  
  */
}
```


**Indexes**

Robe supports the full [Mongo index spec](http://docs.mongodb.org/manual/reference/method/db.collection.ensureIndex/) and 
can ensure that indexes you define are present within a collection:

```js
// get a collection
var collection = db.collection('test', {
  indexes: [
    // each entry in this array represents an index in the collection
    {
      fields: {
        name: -1
      },
      options: {
        unique: true
      }
    },
    {
      fields: {
        name: 1,
        age: 1,
      },
      options: {
        name: 'index2'
      }
    },
  ]
});

// setup all indexes
yield collection.ensureIndexes();
```


**Oplog tailing**

If you are connecting to a Mongo replica set, then you can _tail_ the 
[oplog](http://docs.mongodb.org/manual/core/replica-set-oplog/) through Robe, 
allowing you to be notified when collections within your database get updated 
(even by other processes).

```js
var collection = db.collection('test');

// watch for any changes to the collection
yield collection.watch(function(collectionName, operationType, data) {
  // collectionName = collection which got updated
  // operationType = one of: insert, update, delete
  // data = the data which got inserted or updated
});

/* you can also access the oplog directly on the `db` */

// get the oplog
var oplog = yield db.oplog();

// listen for any operation on any collection
oplog.onAny(function(collectionName, operationType, data) {
  // ...
});

// listen for any operation on the "test" collection
oplog.on('test:*', function(collectionName, operationType, data) {
  // ...
});
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


