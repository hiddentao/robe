var gulp = require('gulp'),
  path = require('path');

var jade = require('gulp-jade');
var stylus = require('gulp-stylus');
var nib = require('nib');
var minifyCSS = require('gulp-minify-css');
var expect = require('gulp-expect-file');
var runSequence = require('run-sequence');


var paths = {
  stylusSrcFiles: './stylus/style.styl',
  stylusSrcFilesWatch: './stylus/*.styl',
  cssBuildFolder: './css',
  jadeSrcFiles: './jade/*.jade',
  jadeSrcFilesWatch: './jade/*.jade',
  jadeBuildFolder: './',
};


gulp.task('css', function () {
  return gulp.src( paths.stylusSrcFiles )
    .pipe( stylus({
      use: [ nib() ],
      errors: true
    }) )
    .pipe( minifyCSS({
      keepSpecialComments: 0,
      noAdvanced: true
    }) )
    .pipe( gulp.dest( paths.cssBuildFolder ) )
    ;
});


gulp.task('jade', function () {
  return gulp.src( paths.jadeSrcFiles )
    .pipe( jade() )
    .pipe( gulp.dest( paths.jadeBuildFolder ) )
    ;
});


gulp.task('watch', ['css'], function() {
  gulp.watch(paths.stylusSrcFilesWatch, ['css']); 
  gulp.watch(paths.jadeSrcFilesWatch, ['jade']); 
});


gulp.task('build', ['css', 'jade']);


gulp.task('verify-build', function() {
  return gulp.src(
      [].concat(
        path.join(paths.cssBuildFolder, '**', '*.css'),
        path.join(paths.jadeBuildFolder, '*.html')
      )
    )
    .pipe( expect([
      'css/style.css',
      'index.html'
    ]) )
  ;
})


gulp.task('default', function(cb) {
  runSequence(
    'build', 
    'verify-build',
    cb
  );
});

