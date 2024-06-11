function postLoader(content, map, meta) {
  console.log("==================");
  console.log("I am postLoader, and I am executed!");
  console.log("==================\n");
  return content;
}

module.exports = postLoader;
