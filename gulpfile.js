var gulp = require('gulp'),
  path = require('path');

var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var runSequence = require('run-sequence');


var srcFile = './simple-mongo-schema.js';
var buildFolder = '.'



gulp.task('jshint', function() {
  return gulp.src(srcFile)
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'))
  ;
});


gulp.task('test', function () {
  return gulp.src('./test.js', { read: false })
      .pipe(mocha({
        ui: 'exports',
        reporter: 'spec'
      }))
    ;
});


gulp.task('default', function(cb) {
  runSequence('jshint', 'test', cb);
});



