function aLoader(content, map, meta) {
  console.log("=== a loader execute ===");
  console.log("content is", content);
  console.log("\n");
  return content;
}
aLoader.pitch = function (remainingRequest, precedingRequest, data) {
  console.log("=== a pitching loader execute ===");
};
module.exports = aLoader;
