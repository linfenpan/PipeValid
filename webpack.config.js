'use strict';

const webpack = require('webpack');

module.exports = {
  entry: {
    index: [
      './src/util.js',
      './src/thenable.js',
      './src/checker.js',
      './src/item.js',
      './src/PipeValid.js'
    ]
  },
  output: {
    path: __dirname,
    filename: '[name].js',
    chunkFilename: '[id].js'
  },
};
