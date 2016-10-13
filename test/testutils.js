"use strict";

require('co-mocha');


const _ = require('lodash'),
  chai = require('chai'),
  fs = require('fs'),
  Q = require('bluebird'),
  path = require('path'),
  spawn = require('cross-spawn'),
  shell = require('shelljs'),
  sinon = require('sinon');

chai.use(require('sinon-chai'));

exports.assert = chai.assert;
exports.expect = chai.expect;
exports.should = chai.should();

exports.sinon = sinon;

exports.Robe = require('../');


exports.createTest = function(_module) {
  var testMethods = {};
  
  var testStructure = {
    beforeEach: function*() {
      this.mocker = sinon.sandbox.create();
    },
    afterEach: function*() {
      this.mocker.restore();
    },
    'tests': testMethods
  };
  
  if (!process.env.CONTINUOUS_INTEGRATION) {
    _.extend(testStructure, {
      before: function*() {
        // generate mongod/ folder and mongod.conf
        const MONGO_DATA_FOLDER = path.join(__dirname, 'mongod', 'data'),
          MONGOD_CONF_PATH = path.join(__dirname, 'mongod', 'mongod.conf');
        
        shell.rm('-rf', MONGO_DATA_FOLDER);
        shell.mkdir('-p', MONGO_DATA_FOLDER);
        
        fs.writeFileSync(MONGOD_CONF_PATH, 
`systemLog:
  destination: file
  path: ${__dirname}/mongod/mongod.log
  logAppend: true
storage:
  dbPath: ${__dirname}/mongod/data
net:
  bindIp: 127.0.0.1
  port: 37127
`
        );
        
        yield new Q((resolve, reject) => {
          setTimeout(() => {
            this.mongod.removeListener('error', reject);
            
            resolve();
          }, 1000);
          
          this.mongod = spawn('mongod', ['--config', MONGOD_CONF_PATH]);

          this.mongod.once('error', reject);
        })
        .delay(2000)
        .then(() => {
          this.hostPort = '127.0.0.1:37127';          
        });
      },
      after: function*() {
        yield new Q((resolve, reject) => {
          try {
            this.mongod.once('exit', resolve);
            this.mongod.once('error', reject);
            this.mongod.kill();            
          } catch (err) {
            reject(err);
          }
        });        
      },          
    });
  } else {
    _.extend(testStructure, {
      before: function*() {
        this.hostPort = '127.0.0.1:27017';        
      },
    });
  }
  
  _module.exports[path.basename(_module.filename)] = testStructure;
  
  return testMethods;
};
