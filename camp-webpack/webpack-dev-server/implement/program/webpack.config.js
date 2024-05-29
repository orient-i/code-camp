const path = require("node:path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { Configuration, ProvidePlugin } = require("webpack");
/**
 * @type { Configuration }
 */
const Config = {
  mode: "development",
  entry: "./providePlugin.js",
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  plugins: [
    new ProvidePlugin({
      utils: path.resolve(__dirname, "utils.js"),
    }),
    new HtmlWebpackPlugin({ template: "./index.html" }),
  ],
};

module.exports = Config;
