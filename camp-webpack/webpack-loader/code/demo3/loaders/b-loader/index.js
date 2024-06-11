function bLoader(content, map, meta) {
  return content;
}

bLoader.pitch = function (remainingRequest, precedingRequest, data) {
  console.log("===== remainingRequest =====", remainingRequest);
  console.log("===== precedingRequest =====", precedingRequest);
};

module.exports = bLoader;
