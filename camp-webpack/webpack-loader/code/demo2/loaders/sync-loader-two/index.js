function syncLoaderTwo(content, map, meta) {
  const str = `const syncDiv = document.createElement("div");
  syncDiv.innerHTML = "this is content from sync loader two!";
  app.appendChild(syncDiv);\n`;
  return content + str;
}

module.exports = syncLoaderTwo;
