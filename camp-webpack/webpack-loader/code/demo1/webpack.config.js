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
  stats: "minimal",
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ["simple-loader"],
      },
    ],
  },
  resolveLoader: {
    alias: {
      "simple-loader": path.resolve(__dirname, "./simple-loader"),
    },
  },
};

module.exports = config;
