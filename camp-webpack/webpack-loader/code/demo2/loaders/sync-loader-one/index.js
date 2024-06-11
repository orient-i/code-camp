function syncLoaderOne(content, map, meta) {
  this.callback(
    null,
    content + "app.style.color = 'orange';\napp.style['font-size'] = '50px';\n",
    map,
    meta
  );
  return;
}

module.exports = syncLoaderOne;
