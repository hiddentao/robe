var gulp = require('gulp'),
  path = require('path');

var args = require('yargs').argv;

var mocha = require('gulp-spawn-mocha');
var to5 = require('gulp-6to5');
var runSequence = require('run-sequence');


var onlyTest = args.onlyTest || args.limitTest;



gulp.task('to5', function() {
  return gulp.src('./src/*.js')
    .pipe( to5({
      blacklist: ['regenerator']
    }) )
    .pipe( gulp.dest('./build') )
});



gulp.task('test', ['to5'], function () {
  return gulp.src([
    onlyTest || './test/**/*.test.js'  
  ], { read: false })
      .pipe(mocha({
        timeout: 20000,
        ui: 'exports',
        reporter: 'spec'
      }))
    ;
});


gulp.task('default', function(cb) {
  runSequence('test', cb);
});



