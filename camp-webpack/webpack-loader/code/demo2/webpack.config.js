const path = require("node:path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const { Configuration } = require("webpack");
/**
 * @type {Configuration}
 */
const config = {
  mode: "none",
  entry: "./src/index.js",
  output: {
    clean: true,
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ["async-loader", "sync-loader-two", "sync-loader-one"],
      },
    ],
  },
  stats: "minimal",
  resolveLoader: {
    modules: ["loaders", "node_modules"],
  },
  plugins: [new HtmlWebpackPlugin({ template: "./index.html" })],
};

module.exports = config;
