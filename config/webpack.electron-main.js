const merge = require('webpack-merge');
const webpack = require('webpack');
const config = require('./webpack.base');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports =
  {
    entry: {main: "./electron/src/main.ts"},
    output: {
      filename: "[name].js",
      path: path.join(__dirname, "../electron/dist"),
      publicPath: '/'
    },
  
    // Enable sourcemaps for debugging webpack's output.
    devtool: "eval",
  
    resolve: {
      extensions: [".ts"],
      alias: {}
    },
    node: {
      __dirname: false
    },  
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: "awesome-typescript-loader",
          options: {
            configFileName: 'electron/tsconfig.json'
          }
        }
      ]
    },
    target: 'electron-main'
  }
