const gulp = require('gulp');
const ts = require('gulp-typescript');
const ava = require('gulp-ava');
const nodemon = require('gulp-nodemon');
const merge = require('merge2');

const tsProject = ts.createProject('server/tsconfig.json');

gulp.task('scripts', function() {
  const tsResult = gulp.src('server/src/**/*.ts')
    .pipe(tsProject());

  return merge([ // Merge the two output streams, so this task is finished when the IO of both operations is done.
    tsResult.dts.pipe(gulp.dest('server/defs')),
    tsResult.js.pipe(gulp.dest('server/dist'))
  ]);
});

gulp.task('test', ['scripts'], function () {
	gulp.src('server/dist/**/*.test.js')
		.pipe(ava());
});

gulp.task('watch', ['scripts'], function() {
  gulp.watch('server/src/**/*.ts', ['scripts']);
  nodemon({
    script: 'server/index.js',
    ext: 'js html',
    env: { 'NODE_ENV': 'development' }
  });
});

gulp.task('test:watch', ['scripts'], function() {
  gulp.watch('server/src/**/*.ts', [ 'test', 'scripts']);
	gulp.src('server/dist/**/*.test.js')
		.pipe(ava());
});
