function simpleLoader(content, map, meta) {
  // 如果要用 map 和 meta，那需要使用 this.callback() 或者是 this.async()() 这种函数调用的方式才可进行数据传递
  console.log("==================");
  console.log("I am simpleLoader, and I am executed!");
  console.log("==================");
  return content;
}

module.exports = simpleLoader;
