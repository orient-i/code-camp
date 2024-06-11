function bLoader(content, map, meta) {
  console.log("=== b loader execute ===");
  return content;
}
bLoader.pitch = function (remainingRequest, precedingRequest, data) {
  console.log("=== b pitching loader execute ===");
  return "'msg from1'";
};
module.exports = bLoader;
