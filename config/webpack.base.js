const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    application: "./client/src/index.tsx",
    vendor: ['react', 'react-dom', 'react-redux', 'react-router', 'react-router-redux', 'redux']
  },
  output: {
    filename: "bundle.js",
    path: path.join(__dirname, "../client/dist")
  },

  // Enable sourcemaps for debugging webpack's output.
  devtool: "source-map",

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json", ".scss"],
    alias: {
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      'fetch': 'imports-loader?this=>global!exports-loader?global.fetch!whatwg-fetch'  // fetch API
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      filename: 'vendor.bundle.js',
      minChunks: Infinity
    })
  ],
  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      {
        test: /\.tsx?$/,
        loader: "awesome-typescript-loader",
        options: {
          configFileName: 'client/tsconfig.json'
        }
      },

      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },
      {
         test: /\.scss$/,
         use: [{
           loader: "style-loader"
         }, {
           loader: "css-loader"
         }, {
           loader: 'postcss-loader'
         }, {
           loader: "sass-loader",
           options: {
             includePaths: [path.join(__dirname, '../client/src/styles')]
           }
         }]
       }
    ]
  },

  // When importing a module whose path matches one of the following, just
  // assume a corresponding global variable exists and use that instead.
  // This is important because it allows us to avoid bundling all of our
  // dependencies, which allows browsers to cache those libraries between builds.
  externals: {

  },
};
