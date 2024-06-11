function aLoader(content, map, meta) {
  console.log("\nI am a loader, and my data is", this.data, "\n");
  return content;
}

aLoader.pitch = function (remainingRequest, precedingRequest, data) {
  data.msg = "Hi loader, I am your pitch part";
  // return "msg from";
};

module.exports = aLoader;
