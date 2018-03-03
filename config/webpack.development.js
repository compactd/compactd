const merge = require('webpack-merge');
const webpack = require('webpack');
const config = require('./webpack.base');

module.exports = merge(config, {
  devtool: 'eval',
  entry: {
    'app': [
        "./client/src/index.tsx"
      ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ]
});
