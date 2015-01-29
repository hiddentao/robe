var gulp = require('gulp'),
  path = require('path');


var mocha = require('gulp-mocha');
var to5 = require('gulp-6to5');
var runSequence = require('run-sequence');



gulp.task('to5', function() {
  return gulp.src('./src/*.js')
    .pipe( to5({
      blacklist: ['regenerator']
    }) )
    .pipe( gulp.dest('./build') )
});


gulp.task('test', ['to5'], function () {
  return gulp.src('./test/all-tests.js', { read: false })
      .pipe(mocha({
        ui: 'exports',
        reporter: 'spec'
      }))
    ;
});


gulp.task('default', function(cb) {
  runSequence('test', cb);
});



