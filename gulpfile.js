'use strict';

const pkg = require('./package.json');
const gulp = require('gulp');
const concat = require('gulp-concat');
const header = require('gulp-header');
const footer = require('gulp-footer');
const minify = require('gulp-minify');
const replace = require('gulp-replace');

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

const replaceMap = {};
function getReplaceKey(key) {
  if (!replaceMap[key]) {
    replaceMap[key] = autoKey();
  }
  return replaceMap[key];
}


const maxIndex = 123;
const minIndex = 97;
const distance = maxIndex - minIndex;
let currentIndex = maxIndex;
function autoKey() {
  let ch = '';
  let leave = currentIndex - maxIndex;

  do {
    const index = leave % distance;
    ch = String.fromCharCode(index + minIndex) + ch;
    leave = Math.floor((leave - index) / distance);
  } while (leave > 0);

  currentIndex++;
  return ch;
}

const files = [
  './src/util.js',
  './src/thenable.js',
  './src/checker.js',
  './src/item.js',
  './src/PipeValid.js'
];
const targetName = 'index.js';
const targetDir = './';

gulp.task('concat', () => {
  return gulp.src(files)
    .pipe(concat(targetName))
    .pipe(header(headerText))
    .pipe(footer(footerText))
    .pipe(
      minify({
        preserveComments: 'some'
      })
    )
    .pipe(
      gulp.dest(targetDir)
    );
});

// 虽然相差不大，就想玩玩~
gulp.task('tryToMinify', (callback) => {
  setTimeout(() => {
    gulp.src(targetName.replace('.js', '-min.js'))
      .pipe(
        replace(/(_+\w+?)\b/g, (str, key) => {
          return '_' + getReplaceKey(key);
        })
      )
      .pipe(
        gulp.dest('./')
      );
    callback();
  }, 1000);
})

gulp.task('default', ['concat', 'tryToMinify']);
