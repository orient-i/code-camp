function preLoader(content, map, meta) {
  console.log("==================");
  console.log("I am preLoader, and I am executed!");
  console.log("==================\n");
  return content;
}

module.exports = preLoader;
