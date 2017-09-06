const merge = require('webpack-merge');
const webpack = require('webpack');
const config = require('./webpack.base');

module.exports = merge(config, {
  devtool: 'eval',
  entry: {
    'app': ['react-hot-loader/patch',
    
        'webpack-hot-middleware/client',
        // bundle the client for webpack-dev-server
        // and connect to the provided endpoint
    
        'webpack/hot/only-dev-server',
        // bundle the client for hot reloading
        // only- means to only hot reload for successful updates
        "./client/src/index.tsx"
      ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ]
});
