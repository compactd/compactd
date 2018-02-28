const merge = require('webpack-merge');
const webpack = require('webpack');
const config = require('./webpack.base');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = 
  merge(config, {
    devtool: 'eval',
    entry: {
      'app': [
          "./client/src/electron.tsx"
        ]
    },
    target: 'electron-renderer'
  })
