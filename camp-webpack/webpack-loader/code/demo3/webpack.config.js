const path = require("node:path");

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
        use: ["a-loader", "b-loader", "c-loader"],
      },
    ],
  },
  stats: "minimal",
  resolveLoader: {
    modules: ["loaders", "node_moduels"],
  },
};

module.exports = config;
