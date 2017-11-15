const merge = require('webpack-merge');
const webpack = require('webpack');
const config = require('./webpack.base');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = merge(config, {
  devtool: 'source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new UglifyJSPlugin()
  ]
});
