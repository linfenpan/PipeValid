'use strict';

const pkg = require('./package.json');
const gulp = require('gulp');
const concat = require('gulp-concat');
const header = require('gulp-header');
const minify = require('gulp-minify');
const webpack = require('webpack-stream');
const wait = require('gulp-wait');

const banner = `/*! ${pkg.name}-${pkg.version} by ${pkg.author} ${pkg.license} ${pkg.homepage}*/
`;

gulp.task('concat', () => {
  const stream = gulp.src([
      './src/util.js',
      './src/thenable.js',
      './src/checker.js',
      './src/item.js',
      './src/PipeValid.js'
    ])
    .pipe(concat('index.js'))
    .pipe(header(banner))
    .pipe(
      gulp.dest('./')
    );
  return stream;
});

gulp.task('webpack', (cb) => {
  // 等待文件创建完成
  setTimeout(function(){
    gulp.src('./index.js')
      .pipe(
        webpack({
          entry: {
            index: './index.js'
          },
          output: {
            filename: 'index.js'
          }
        })
      )
      .pipe(
        gulp.dest('./')
      );
    cb();
  }, 500);
});

gulp.task('default', ['concat', 'webpack']);

    // .pipe(minify())
    // .pipe(
    //   webpack({
    //     entry: 'index.js',
    //     output: {
    //       filename: 'index.js'
    //     }
    //   })
    // )
// });
