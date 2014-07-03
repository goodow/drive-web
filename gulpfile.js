var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var cssmin = require('gulp-cssmin');
var bower = require('gulp-bower');
var mkdirp = require("mkdirp");
var del = require('del');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var gulpBowerFiles = require('gulp-bower-files');


var paths={
  scripts:['app/js/*.js'],
  css:'app/css/*.css',
  images:'app/img/*'
};
// Lint JavaScript
gulp.task('jshint', function () {
    return gulp.src(paths.scripts)
        .pipe(reload({stream: true, once: true}))
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish'))
        .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});
// Optimize Images
gulp.task('images', function () {
    return gulp.src(paths.images)
        .pipe($.cache($.imagemin({
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest('app/build/images'))
        .pipe($.size({title: 'images'}));
});
gulp.task('uglify',function(){
  return gulp.src(paths.scripts)
    .pipe(uglify())
    .pipe(concat('all.min.js'))
    .pipe(gulp.dest('app/build/js'));
});
gulp.task('concat',function(){
  return gulp.src(paths.scripts)
    .pipe(concat('all.js'))
    .pipe(gulp.dest('app/build/js'));
});
gulp.task('cssmin',function(){
  return gulp.src(paths.css)
    .pipe(concat('all.css'))
    .pipe(gulp.dest('app/build/css'));
});
gulp.task('serve',function() {
    browserSync({
        notify: false,
        server: {
            baseDir: ['app']
        }
    });
});

//gulp.task('bower', function() {
//    bower()
//        .pipe(gulp.dest('app/bower_components'));
//});
gulp.task("bower-files", function(){
    gulpBowerFiles().pipe(gulp.dest("app/lib"));
//    del("app/bower_components",function(err){
//        console.log(err);
//    })
});

gulp.task('default',['bower-files','uglify','concat','cssmin']);

