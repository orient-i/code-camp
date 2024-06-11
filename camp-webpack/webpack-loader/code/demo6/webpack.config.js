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
        test: /\.json$/,
        use: ["normal-loader"],
      },
      {
        test: /\.json$/,
        use: ["pre-loader"],
        enforce: "pre",
      },
      {
        test: /\.json$/,
        use: ["post-loader"],
        enforce: "post",
      },
    ],
  },
  stats: "minimal",
  resolveLoader: {
    modules: [path.resolve(__dirname, "loader")],
  },
};

module.exports = config;
