function styleLoader(source) {
  // css-loader 返回的是一份 Js 脚本字符串，如果 style-loader 的功能设计在 normal 阶段，那么就只能在这里执行这份脚本，进而获取到这份脚本最终导出的内容，最后再针对性做出修改
  // 但是如果要在这里执行脚本，那就需要实现这份脚本中众多方法才行，这过于麻烦了
  // console.log(source);
  // const script = `
  //   const styleEl = document.createElement('style')
  //   styleEl.innerHTML = ${JSON.stringify(source)}
  //   document.head.appendChild(styleEl)
  // `;
  // return script;
}

// 既然我们手动执行脚本很麻烦，那就干脆不处理让 webpack 去处理，处理完之后我们再去拿结果
styleLoader.pitch = function (remainingRequest, previousRequest, data) {
  // webpack 会将返回的 js 脚本编译称为一个 module，同时分析这个 module 中的依赖语句进行递归编译。
  // 由于 style-loader pitch 阶段返回的脚本中存在 import 语句，那么此时 webpack 就会递归编译 import 语句的路径模块。

  // 注意：remainingRequest 前面的 !! 表示强制忽略所有的 loader 配置，只使用 inline loader。避免造成死循环
  const script = `
    import style from "!!${remainingRequest}";
    const styleEl = document.createElement('style');
    styleEl.innerHTML = style;
    document.head.appendChild(styleEl);
  `;
  return script;
};

module.exports = styleLoader;
