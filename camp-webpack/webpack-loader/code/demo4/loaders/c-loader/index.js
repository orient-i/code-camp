function cLoader(content, map, meta) {
  console.log("=== c loader execute ===");
  return content;
}
cLoader.pitch = function (remainingRequest, precedingRequest, data) {
  console.log("=== c pitching loader execute ===");
};
module.exports = cLoader;
