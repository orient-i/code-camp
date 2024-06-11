// index.js
const fs = require("node:fs");

function asyncLoader(content, map, meta) {
  // callback 的参数格式和同步 Loader 里的 this.callback 一样
  const callback = this.async();
  fs.readFile(`${__dirname}/script.txt`, "utf-8", (err, data) => {
    callback(null, content + data, map, meta);
  });
}

module.exports = asyncLoader;
