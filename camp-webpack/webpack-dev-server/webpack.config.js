const path = require("node:path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { Configuration } = require("webpack");

/**
 * @type { Configuration }
 */
const Config = {
  mode: "development",
  entry: "./src/index.js",
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  plugins: [new HtmlWebpackPlugin({ template: "./index.html" })],
  devtool: "inline-source-map",
  stats: "none",
};

module.exports = Config;
