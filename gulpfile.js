var gulp = require('gulp');
var shell = require('gulp-shell');
var nodemon = require('gulp-nodemon');

gulp.task('olympics-bot', function(){
	nodemon({ script: 'index.js' });
});

gulp.task('default', ['olympics-bot']);