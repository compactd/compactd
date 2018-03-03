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
          "./client/src/index-electron.tsx"
        ]
    },
    devServer: {
      historyApiFallback: {
        index: 'dist/index.html'
      }
    },
    target: 'electron-renderer'
  })
