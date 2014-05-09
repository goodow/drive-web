var gulp = require('gulp');


var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var cssmin = require('gulp-cssmin');

var paths={
  scripts:['app/js/*.js'],
  css:'app/css/*.css'
};
gulp.task('uglify',function(){
  return gulp.src(paths.scripts)
    .pipe(uglify())
    .pipe(concat('all.min.js'))
    .pipe(gulp.dest('build/js'));
});
gulp.task('concat',function(){
  return gulp.src(paths.scripts)
    .pipe(concat('all.js'))
    .pipe(gulp.dest('build/js'));
});
gulp.task('cssmin',function(){
  return gulp.src(paths.css)
    .pipe(concat('all.js'))
    .pipe(gulp.dest('build/css'));
});
gulp.task('default',['uglify','concat','cssmin']);

