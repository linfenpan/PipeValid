'use strict';

const pkg = require('./package.json');
const gulp = require('gulp');
const concat = require('gulp-concat');
const header = require('gulp-header');
const footer = require('gulp-footer');
const minify = require('gulp-minify');
const webpack = require('webpack-stream');

// 进行 umd 打包
const headerText = `/*! ${pkg.name}-${pkg.version} by ${pkg.author} ${pkg.license} ${pkg.homepage}*/
(function (root, factory) {
  if (typeof define === 'function') {
    if (define.amd) {
      // AMD
      define(factory);
    } else {
      // CMD
      define(function(require, exports, module) {
        module.exports = factory();
      });
    }
  } else if (typeof exports === 'object') {
    // Node, CommonJS之类的
    module.exports = factory();
  } else {
    // 浏览器全局变量(root 即 window)
    root.PipeValid = factory();
  }
}(this, function ($) {
`;
const footerText = `
  return PipeValid;
}));
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
    .pipe(header(headerText))
    .pipe(footer(footerText))
    .pipe(
      minify({
        preserveComments: 'some'
      })
    )
    .pipe(
      gulp.dest('./')
    );
  return stream;
});


gulp.task('default', ['concat']);
