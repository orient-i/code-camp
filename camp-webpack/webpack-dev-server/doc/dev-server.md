`webpack-dev-server` 给浏览器和 `devServer` 之间的传输方式提供了三个选项：`sockjs|ws|custom`，不同的选项对应着不同的浏览器端 `WebSocket` 实现方案，`this.getClientTransport()` 会根据配置选项的值返回对应的资源文件。默认配置下，传输方式为 `ws`，`webpack-dev-server/client/clients/WebSocketClient.js` 文件将成为浏览器端 `WebSocket` 的实现方案，也就是浏览器自带的 `WebSocket` 方案。 &#x20;

#### HotModuleReplacementPlugin &#x20;

`HMR` 插件作用如下：

*   找出发生变化的 `module`。

```javascript
/**
 * 1. fullHash 在官方文档中没有记载，经过测试发现 fullHash 的触发时机在 beforeHash 之后，afterHash 之前，因此 compilation.records 的值是上一次构建的结果。
 * 2. HMR 在 fullHash 这个 hook 上的分支处理有很多，下面是精简后的代码。
 * 3. 总的来说就是将本次构建产物的 hash 和上一次构建产物的 hash 进行对比。如果不相等，那么将 module/chunk 添加到 updatedModules 中。
 */
compilation.hooks.fullHash.tap("HotModuleReplacementPlugin", hash => {
  const records = compilation.records;
  for (const chunk of compilation.chunks) {
    const modules = chunkGraph.getChunkModulesIterable(chunk);
    for (const module of modules) {
      if (fullHashModulesInThisChunk.has((module))) {
        if (records.fullHashChunkModuleHashes[key] !== hash) {
          updatedModules.add(module, chunk);
        }
        fullHashChunkModuleHashes[key] = hash;
      } else {
        if (records.chunkModuleHashes[key] !== hash) {
          updatedModules.add(module, chunk);
        }
        chunkModuleHashes[key] = hash;
      }
    }
  });
});
```

*   记录构建产物的 `id`、`hash`、`chunk` 和 `module` 之间的依赖关系等信息。

```javascript
let hotIndex = 0;
const fullHashChunkModuleHashes = {};
const chunkModuleHashes = {};
// records 本身自带的数据很少，这里对 records 做一次数据增强处理，方便下一次构建过程中 fullHash 去对比 hash 找出更新项 
compilation.hooks.record.tap(PLUGIN_NAME, (compilation, records) => {
	if (records.hash === compilation.hash) return;
	const chunkGraph = compilation.chunkGraph;
	records.hash = compilation.hash;
	records.hotIndex = hotIndex;
	records.fullHashChunkModuleHashes = fullHashChunkModuleHashes;
	records.chunkModuleHashes = chunkModuleHashes; 
	records.chunkHashes = {}; 
	records.chunkRuntime = {};
	for (const chunk of compilation.chunks) {
		records.chunkHashes[chunk.id] = chunk.hash;
		records.chunkRuntime[chunk.id] = getRuntimeKey(chunk.runtime);
	}
	records.chunkModuleIds = {};
	for (const chunk of compilation.chunks) {
		records.chunkModuleIds[chunk.id] = Array.from(
			chunkGraph.getOrderedChunkModulesIterable(
				chunk,
				compareModulesById(chunkGraph)
			),
			m => chunkGraph.getModuleId(m)
		);
	}
});
```

*   根据 `chunk/module` 的变动生成一份描述变更的 `JSON` 文件（xxx.hot-update.json）和用来应用更新的 `JS` 文件（xxx.hot-update.js）

```javascript
compilation.hooks.processAssets.tap(
  {
    name: PLUGIN_NAME,
    stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
  },
  () => {
	// other code ...

    for (const entry of renderManifest) {
      let filename;
      let assetInfo;
      if ("filename" in entry) {
        filename = entry.filename;
        assetInfo = entry.info;
      } else {
        ({ path: filename, info: assetInfo } = compilation.getPathWithInfo(
          entry.filenameTemplate,
          entry.pathOptions
        ));
      }
      const source = entry.render();
      compilation.additionalChunkAssets.push(filename);
      // 生成 JS 文件
      compilation.emitAsset(filename, source, {
        hotModuleReplacement: true,
        ...assetInfo,
      });
    }

    // other code ...

    for (const [
      filename,
      { removedChunkIds, removedModules, updatedChunkIds, assetInfo },
    ] of hotUpdateMainContentByFilename) {
      const hotUpdateMainJson = {
        c: Array.from(updatedChunkIds),
        r: Array.from(removedChunkIds),
        m:
          removedModules.size === 0
            ? completelyRemovedModulesArray
            : completelyRemovedModulesArray.concat(
                Array.from(removedModules, (m) => chunkGraph.getModuleId(m))
              ),
      };

      const source = new RawSource(JSON.stringify(hotUpdateMainJson));
      // 生成 JSON 文件
      compilation.emitAsset(filename, source, {
        hotModuleReplacement: true,
        ...assetInfo,
      });
    }
  }
);
```

*   将 `hmr runtime` 注入到构建流程中。前面提到的 `module.hot.check` 正是 `hmr runtime` 添加到 `module` 上的。

```javascript
// webpack/lib/HotModuleReplacementPlugin.js
compilation.hooks.additionalTreeRuntimeRequirements.tap(
	PLUGIN_NAME,
	(chunk, runtimeRequirements) => {
		runtimeRequirements.add(RuntimeGlobals.hmrDownloadManifest); // __webpack_require__.hmrM ---> webpack/lib/web/JsonpChunkLoadingRuntimeModule.js
		runtimeRequirements.add(RuntimeGlobals.hmrDownloadUpdateHandlers); // __webpack_require__.hmrC ---> webpack/lib/hmr/JavascriptHotModuleReplacement.runtime.js
		runtimeRequirements.add(RuntimeGlobals.interceptModuleExecution); // __webpack_require__.i
		runtimeRequirements.add(RuntimeGlobals.moduleCache); // __webpack_require__.c
		// 引入 HMR runtime module
		compilation.addRuntimeModule(
			chunk,
			// 这个 module 对应的资源文件是 webpack/lib/hmr/HotModuleReplacementRuntimeModule.js
			// hmr runtime 的核心逻辑所在文件是 webpack/lib/hmr/HotModuleReplacement.runtime.js
			// 这个 module 引入了核心逻辑文件，并通过正则表达式将核心逻辑文件中的一些 $ 开头的无效变量替换成了 RuntimeGlobals 下的有效变量
			new HotModuleReplacementRuntimeModule()
		);
	}
);
```

`__webpack_require__.hmrM` 变量的赋值逻辑在 `webpack/lib/web/JsonpChunkLoadingRuntimeModule.js` 文件中，是个函数，具体函数体见下图：



`__webpack_require__.p` 变量的赋值逻辑在 `webpack/lib/runtime/AutoPublicPathRuntimeModule.js` 文件中，是个字符串，它的值基本等于 `window.location.href`





`__webpack_require__.hmrC` 变量是在 `webpack/lib/hmr/JavascriptHotModuleReplacement.runtime.js` 文件中被

```javascript
// webpack/lib/hmr/HotModuleReplacement.runtime.js
function hotCheck(applyOnUpdate) {
  return (
    setStatus("check")
      // 1. 请求 xxx.hot-update.json 文件
      .then(__webpack_require__.hmrM)
      .then(function (update) {
        return setStatus("prepare").then(function () {
          var updatedModules = [];
          blockingPromises = [];
          currentUpdateApplyHandlers = [];
          // 2. 请求变更后的 chunks
          return Promise.all(
            Object.keys(__webpack_require__.hmrC).reduce(function (
              promises,
              key
            ) {
              __webpack_require__.hmrC[key](
                update.c,
                update.r,
                update.m,
                promises,
                currentUpdateApplyHandlers,
                updatedModules
              );
              return promises;
            },
            [])
          ).then(function () {
            return waitForBlockingPromises(function () {
              if (applyOnUpdate) {
                // 3. 进行热更新应用
                return internalApply(applyOnUpdate);
              } else {
                return setStatus("ready").then(function () {
                  return updatedModules;
                });
              }
            });
          });
        });
      })
  );
}
```

#### this.setupHooks

在 `compiler.hooks.done` 添加一个监听函数，编译完成之后发消息通知浏览器

```javascript
setupHooks() {
  // https://webpack.js.org/api/stats
  this.compiler.hooks.done.tap("webpack-dev-server", (stats) => {
    if (this.webSocketServer) {
      // Server 类本身有一个 currentHash 属性，
      // this.sendStats 会通过对比 currentHash 和 stats.hash 来决定发送 "still-ok" 或者 "hash"&"ok" 消息给所有连接到 devServer 的客户端
      this.sendStats(this.webSocketServer.clients, this.getStats(stats));
    }
    this.stats = stats;
  });
}
```

前面在分析 `this.addAdditionalEntries` 时有提到客户端的 `WebSocket` 的创建是在 `webpack-dev-server/client/index.js` 文件中，

```javascript
var status = {
  isUnloading: false,
  currentHash: __webpack_hash__
};

var options = {
  hot: false, // liveReload 的上位替代，使用 HMR 来处理资源更新（https://www.webpackjs.com/concepts/hot-module-replacement/#get-started）
  liveReload: false, // 当资源变更时，是否刷新整个页面
  progress: false, // 是否在浏览器中以百分比显示编译进度
  overlay: false // 当出现编译错误或警告时，是否在浏览器中显示全屏覆盖。
};

var onSocketMessage = {
  // other handler ...
  hot: function hot() {
    if (parsedResourceQuery.hot === "false") {
      return;
    }
    options.hot = true;
  },
  hash: function hash(_hash) {
    status.previousHash = status.currentHash;
    status.currentHash = _hash;
  },
  "still-ok": function stillOk() {
    log.info("Nothing changed.");
    if (options.overlay) {
      overlay.send({ type: "DISMISS" });
    }
  },
  ok: function ok() {
    if (options.overlay) {
      overlay.send({ type: "DISMISS" });
    }
    // 注意这个 reloadApp
    reloadApp(options, status);
  },
};

var socketURL = createSocketURL(parsedResourceQuery);
socket(socketURL, onSocketMessage, options.reconnect);
```

当资源编译完成之后，`devServer` 会向所有连接的客户端发送 `ok` 消息，`ok handler` 是客户端获取最新资源的关键。`reloadApp` 的关键则在于会向外发送一个 `webpackHotUpdate` 消息（如果使用 `liveReload` 那就会直接触发页面刷新）：

```javascript
var search = self.location.search.toLowerCase();
var allowToHot = search.indexOf("webpack-dev-server-hot=false") === -1;
if (hot && allowToHot) {
  log.info("App hot update...");
  hotEmitter.emit("webpackHotUpdate", status.currentHash);
}
```

而消费 `webpackHotUpdate` 消息的正是 `webpack/hot/dev-server.js` 文件。在收到消息之后，会触发 `module.hot.check` 方法，这个方法是由后面的 `HMR` 插件所添加的：

```javascript
if (module.hot) {
  var check = function check() {
    module.hot
      .check(true)
      .then(function (updatedModules) {})
      .catch(function (err) {});
  };
  var hotEmitter = require("./emitter");
  hotEmitter.on("webpackHotUpdate", function (currentHash) {
    if (!upToDate() && module.hot.status() === "idle") {
      check();
    }
  });
}
```

#### this.setupApp

创建 `express` 实例，并赋值给 `Server.app`

```javascript
setupApp() {
  this.app = new (getExpress())();
}
```

#### this.setupHostHeaderCheck

给 `express` 实例添加请求头校验

#### this.setupDevMiddleware

导入 `webpack-dev-middleware` 中间件

```javascript
setupDevMiddleware() {
  const webpackDevMiddleware = require("webpack-dev-middleware");

  // middleware for serving webpack bundle
  this.middleware = webpackDevMiddleware(
    this.compiler,
    this.options.devMiddleware,
  );
}
```

`webpack-dev-middleware` 中间件的核心在于下面这两处：

```javascript
// webpack-dev-middleware/dist/index.js
function wdm(compiler, options = {}) {
  // other code ...

  // 修改 webpack 默认的文件管理系统，借助 memfs (https://www.npmjs.com/package/memfs) 将原来的“写入磁盘”改为“写入内存”。
  setupOutputFileSystem(context);

  // 开启 webpack 的 watch 模式（底层是依赖于 fs.watch 实现）监听文件变化，当文件发生变化时重新编译
  context.watching = compiler.watch(watchOptions, errorHandler);
  const filledContext = context;
  const instance = middleware(filledContext);
  // other code ...
  return instance;
}
```

#### this.setupMiddlewares

给 `express` 实例添加中间件，比如前面导入的 `webpack-dev-middleware` 和负责接口代理的 `http-proxy-middleware`

#### this.createServer

根据 `devServer.server` 配置项的值（默认是 `http`），创建开发服务器，并使用前面创建的 `express` 实例来处理请求。

```javascript
createServer() {
  const { type, options } = this.options.server;
  this.server = require(type).createServer(options, this.app);
  // ...
}
```

