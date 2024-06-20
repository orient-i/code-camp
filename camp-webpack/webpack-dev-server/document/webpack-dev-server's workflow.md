### 前言

热更新极大地提高了开发体验，让开发人员不用在每次代码修改之后去手动刷新浏览器就可以看到最新效果。`webpack-dev-server` 是 `webpack` 支持热更新特性的核心，文章围绕下面几个问题对 `webpack-dev-server` 的运行原理进行简单分析：

1.  `webpack-dev-server` 介入构建流程的入口在哪儿？
2.  `webpack-dev-server` 在构建流程中做了哪些工作？

### 例子

本文基于下面的例子进行原理分析：

    // 目录结构
    .
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── src
    │   ├── hello.js
    │   └── index.js
    └── webpack.config.js

```html
// index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>webpack-dev-server</title>
  </head>
  <body></body>
</html>
```

```json
{
  "name": "webpack-dev-server",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "webpack serve --port 3000"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "html-webpack-plugin": "^5.6.0",
    "webpack": "^5.91.0",
    "webpack-cli": "^5.1.4",
    "webpack-dev-server": "^5.0.4"
  }
}
```

```javascript
// hello.js
const hello = () => {
  return "hello world nice to meet you";
};
export default hello;

// index.js
import hello from "./hello.js";
const div = document.createElement("div");
div.innerHTML = hello();
document.body.appendChild(div);
if (module.hot) {
  module.hot.accept("./hello.js", function () {
    div.innerHTML = `${hello()}!!!`;
  });
}
```

```typescript
// webpack.config.js
const path = require("node:path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { Configuration } = require("webpack");

/**
 * @type { Configuration }
 */
const Config = {
  mode: "development",
  entry: "./src/index.js",
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  devServer: {
    open: false,
    // hot: true, // webpack5 默认值
  },
  plugins: [new HtmlWebpackPlugin({ template: "./index.html" })],
  devtool: "inline-source-map",
  stats: "none",
};

module.exports = Config;
```

### 入口

当在终端敲下命令 `npm start` 之后，整个工作流程就开始了：\
![start](http://47.106.154.218/share/webpack/dev-server/dev-server-start.png "start")\
`WebpackCLI` 是 `webpack-cli/lib/webpack-cli.js` 文件的导出内容，它通过第三方库 [commander](https://www.npmjs.com/package/commander) 来处理命令行交互。下面是它关于 `webpack-dev-server` 运行部分精简之后的代码：

```javascript
const { program } = require("commander");

class WebpackCLI {
  constructor() {
    this.program = program;
    this.program.name("webpack");
  }

  async run(args, parseOptions) {
  
    // 根据命令名称，注册对应的 action
    const loadCommandByName = async (commandName, allowToInstall = false) => {
      // 导入 @webpack-cli/serve 包，这个包导出的也是一个类：ServeCommand
      const loadedCommand = await this.tryRequireThenImport(
        "@webpack-cli/serve",
        false
      );
      // 实例化 ServeCommand 类
      const command = new loadedCommand();
      // 运行 ServeCommand 的 apply 方法
      await command.apply(this);
    };
  
    // 由于这个 action 没有关联任何命令
    // 当 parseAsync 解析之后得到的命令没有找到对应的 action（又或者解析之后发现命令为空）时
    // 该 action 将被触发
    this.program.action(async (options, program) => {
      // 解析出没有被处理的具体指令
      // operands = ['serve'], unknown = []
      const { operands, unknown } = this.program.parseOptions(program.args);
      const hasOperand = typeof operands[0] !== "undefined";
      // 如果没有命令，则默认执行 build 命令
      const operand = hasOperand ? operands[0] : "build";
      let commandToRun = operand;
      // 如果这个命令是 webpack 内置命令，那么就通过 loadCommandByName 去注册这个命令对应的 action
      if (isKnownCommand(commandToRun)) {
        await loadCommandByName(commandToRun, true);
      }
      // 触发 loadCommandByName 注册的 action
      await this.program.parseAsync(
        [commandToRun, ...commandOperands, ...unknown],
        {
          from: "user",
        }
      );
    });
    // 解析命令行参数，并根据解析得到的命令自动触发之前注册到指令上的 action
    await this.program.parseAsync(args, parseOptions);
  }
}
```

虽然 `loadCommandByName` 最后是调用了 `ServeCommand.apply` 方法，但其实这个方法内部还是用的 `WebpackCLI.makeCommand` 来给命令注册 action 的。\
!['@webpack-cli/serve'](http://47.106.154.218/share/webpack/dev-server/@webpack-cli-serve.png "'@webpack-cli/serve'")

下面是 `ServeCommand.apply` 精简后的代码：

```javascript
class ServeCommand {
  async apply(cli) {
    // 加载 webpack-dev-server 所支持的配置项定义
    const loadDevServerOptions = () => {
      // 引入 wepack-dev-server 包
      const devServer = require(WEBPACK_DEV_SERVER_PACKAGE);
      // 使用 webpack/lib/cli.js 文件里的 getArguments 方法将 webpack-dev-server 用来定义配置项的 schema 转换成配置 Map
      const options = cli.webpack.cli.getArguments(devServer.schema);
      // New options format
      return Object.keys(options).map((key) => {
        options[key].name = key;
        return options[key];
      });
    };
    /**
     * WebpackCLI.makeCommand 的逻辑可以简单概括为下面四点
     * 1. 根据 params[0].name 定义一个指令
     * 2. 确认 params[0].dependencies 已经安装
     * 3. 遍历 params[1] 的返回值，通过 WebpackCLI.makeOption 将选项逐个添加到前面定义的指令上
     * 4. 指定 params[2] 作为前面定义的指令的 action
     */
    await cli.makeCommand(
      {
        name: "serve [entries...]",
        alias: ["server", "s"],
        description:
          "Run the webpack dev server and watch for source file changes while serving.",
        usage: "[entries...] [options]",
        pkg: "@webpack-cli/serve",
        dependencies: [WEBPACK_PACKAGE, WEBPACK_DEV_SERVER_PACKAGE],
      },
      async () => {
        // 导入 webpack 包
        cli.webpack = await cli.loadWebpack();
        // 获取 webpack-dev-server 的配置项定义
        const devServerFlags = loadDevServerOptions();
        // 获取 webpack-cli 的内置配置项
        const builtInOptions = cli.getBuiltInOptions();
        return [...builtInOptions, ...devServerFlags];
      },
      async (entries, options) => {
        // ...

        // 导入 webpack-dev-server 包，它的导出内容是一个类：Server
        const DevServer = require(WEBPACK_DEV_SERVER_PACKAGE);
        // 通过前面的 cli.webpack 创建 compiler，开启编译流程
        const compiler = await cli.createCompiler(webpackCLIOptions);
        // 获取配置文件中的 devServer 配置
        const devServerOptions = Object.assign(
          {},
          compiler.options.devServer || {}
        );
        // 实例化 Server !!!!!!!!!!!
        const server = new DevServer(devServerOptions, compiler);
        // 启动 webpack-dev-server !!!!!!!!!!!
        await server.start();
      }
    );
  }
}
```

下面是一个简易的总体流程例子：

```javascript
const { default: chalk } = require("chalk");
const { program, Option } = require("commander");

class ServeCommand {
  async apply(cli) {
    const loadDevServerOptions = () => {
      return [
        {
          name: "-p, --port <number>",
          description: "specify port number",
        },
      ];
    };
    await cli.makeCommand(
      {
        name: "serve [entries...]",
        description:
          "Run the webpack dev server and watch for source file changes while serving.",
      },
      async () => {
        return loadDevServerOptions();
      },
      async (entries, options) => {
        console.log("\n");
        console.log(
          chalk.yellow(`webpack-dev-sever start and port is ${options.port}!!!`)
        );
        console.log("\n");
      }
    );
  }
}

class WebpackCLI {
  constructor() {
    this.program = program;
    this.program.name("webpack");
  }

  makeOption(command, option) {
    const optionForCommand = new Option(option.name, option.description);
    command.addOption(optionForCommand);
  }

  async makeCommand(commandOptions, options, action) {
    const command = this.program.command(commandOptions.name);
    if (options) {
      options = await options();
      for (const option of options) {
        this.makeOption(command, option);
      }
    }
    command.action(action);
  }

  async loadCommandByName(commandName) {
    if (commandName === "serve") {
      const command = new ServeCommand();
      await command.apply(this);
    }
  }

  async run(args, parseOptions) {
    // 避免使用未定义的 option 时报错
    this.program.allowUnknownOption(true);
    const isKnownCommand = (commandToRun) => commandToRun === "serve";
    this.program.action(async (options, program) => {
      const { operands, unknown } = this.program.parseOptions(program.args);
      const commandToRun = operands[0];
      if (isKnownCommand(commandToRun)) {
        await this.loadCommandByName(commandToRun, true);
      }
      await this.program.parseAsync([commandToRun, ...unknown], {
        from: "user",
      });
    });
    await this.program.parseAsync(args, parseOptions);
  }
}
// node index serve --port 3000
new WebpackCLI().run(process.argv);
```

当在控制台输入 `node index serve --port 3000` 之后，控制台将会输出 `webpack-dev-sever start and port is 3000!!!`

### 核心

`Server(webpack-dev-server/lib/Server.js)` 是 `webpack-dev-server` 包所导出的类，它的工作起点 —— `start` 方法，在代码精简后内容如下：

```javascript
class Server {
  async initialize() {
    const compilers = this.compiler.compilers || [this.compiler];
    compilers.forEach((compiler) => {
      this.addAdditionalEntries(compiler);
      const webpack = compiler.webpack || require("webpack");
      new webpack.ProvidePlugin({
        __webpack_dev_server_client__: this.getClientTransport(),
      }).apply(compiler);
      const HMRPluginExists = compiler.options.plugins.find(
        (p) => p && p.constructor === webpack.HotModuleReplacementPlugin
      );
      if (HMRPluginExists) {
        this.logger.warn(
          `"hot: true" automatically applies HMR plugin, you don't have to add it manually to your webpack configuration.`
        );
      } else {
        // Apply the HMR plugin
        const plugin = new webpack.HotModuleReplacementPlugin();
        plugin.apply(compiler);
      }
    });

    this.setupHooks();
    this.setupDevMiddleware();

    // 创建 express 实例，并赋值给 this.app
    this.setupApp();
    // 给 express 实例添加请求头校验
    this.setupHostHeaderCheck();
  	// 给 express 实例添加中间件，比如前面导入的 webpack-dev-middleware 和负责接口代理的 http-proxy-middleware
    this.setupMiddlewares();
    // 创建 devServer，并使用 express 实例来处理请求
    this.createServer();
  }

  async start() {
    // 整理配置选项
    await this.normalizeOptions();
    // 一系列准备工作
    await this.initialize();
    // 设置开发服务器的启动端口和监听地址
    const listenOptions = { host: this.options.host, port: this.options.port };

    // 启动 devServer
    await new Promise((resolve) => {
      this.server.listen(listenOptions, () => {
        resolve();
      });
    });

    // 创建服务端的 WebSocket
    // 并给 devServer 添加一个协议升级的监听函数，在发现有协议升级的请求时，启用服务端的 webSocket
    this.createWebSocketServer();
  }
}
```

`start` 方法本身的逻辑是很少的，主要逻辑在 `initialize` 中，下面对 `initialize` 方法进行逐步分析。

#### this.addAdditionalEntries

这个函数通过 `webpack` 的内置插件 `EntryPlugin` 添加了两个额外的文件到构建流程中：

*   `webpack-dev-server/client/index.js`

说明：这个文件用于创建客户端的 `WebSocket`，下面是简化后的代码：

```javascript
// 关于 socket.js 的文件说明请看下面的 this.getClientTransport()
import socket from "./socket.js";

var status = {
  isUnloading: false,
  currentHash: __webpack_hash__
};

var options = {
  hot: false, // liveReload 的上位替代，使用 HMR 来处理资源更新（注意，如果没有任何模块 accept 发生变更的 module，那么会抛出一个错误进入降级更新处理逻辑 ———— 页面级刷新）
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
// options.reconnect：WebSocket 断开之后重连次数
socket(socketURL, onSocketMessage, options.reconnect);
```

当资源编译完成之后，`devServer` 会向所有连接的客户端发送 `ok` 消息，`ok handler` 是客户端获取最新资源的关键。`reloadApp` 的关键则在于会向外发送一个 `webpackHotUpdate` 消息（如果使用 `liveReload` 那就会直接触发页面刷新）：

```javascript
// 首次加载，不做处理
var currentHash = status.currentHash, previousHash = status.previousHash;
var isInitial = currentHash.indexOf(previousHash) >= 0;
if (isInitial) {
  return;
}

var search = self.location.search.toLowerCase();
var allowToHot = search.indexOf("webpack-dev-server-hot=false") === -1;
if (hot && allowToHot) {
  log.info("App hot update...");
  hotEmitter.emit("webpackHotUpdate", status.currentHash);
}
```

*   `webpack/hot/dev-server.js`

说明：这个文件是被添加的第二个文件，也正是消费 `webpackHotUpdate` 消息的文件，下面是简化后的文件内容：

```javascript
if (module.hot) {
	var lastHash;
	var upToDate = function upToDate() {
		return (lastHash).indexOf(__webpack_hash__) >= 0;
	};
	var log = require("./log");
	var check = function check() {
		module.hot
			.check(true)
			.then(function (updatedModules) {})
			.catch(function (err) {
				var status = module.hot.status();
				if (["abort", "fail"].indexOf(status) >= 0) {
					log(
						"warning",
						"[HMR] Cannot apply update. " +
							(typeof window !== "undefined"
								? "Need to do a full reload!"
								: "Please reload manually!")
					);
					log("warning", "[HMR] " + log.formatError(err));
					if (typeof window !== "undefined") {
						window.location.reload();
					}
				} else {
					log("warning", "[HMR] Update failed: " + log.formatError(err));
				}
			});
	};
	var hotEmitter = require("./emitter");
	hotEmitter.on("webpackHotUpdate", function (currentHash) {
		lastHash = currentHash;
		if (!upToDate() && module.hot.status() === "idle") {
			log("info", "[HMR] Checking for updates on the server...");
			check();
		}
	});
	log("info", "[HMR] Waiting for update signal from WDS...");
} else {
	throw new Error("[HMR] Hot Module Replacement is disabled.");
}
```

在收到消息之后，会触发 `module.hot.check` 方法来检查资源更新，这个方法是由后面的 `HMR` 插件所添加的。

#### this.getClientTransport()

`ProvidePlugin` 也是一个 `webpack` 内置插件，它的作用就是让开发可以在不导入依赖的情况下直接使用依赖。`webpack` 在识别出变量为 `ProvidePlugin` 定义的 `key` 时，会自动加载对应的依赖文件。这对于一些频繁使用的工具库来说（比如 `lodash` 和 `jQuery`），可以适当减少工作量。更多内容，请看[官方文档](https://webpack.docschina.org/plugins/provide-plugin/)。

```javascript
// 这里通过 ProvidePlugin 插件将 this.getClientTransport 的返回值设置为 __webpack_dev_server_client__ 变量的值
new webpack.ProvidePlugin({
  __webpack_dev_server_client__: this.getClientTransport(),
}).apply(compiler);
```

`webpack-dev-server` 给客户端和 `devServer` 之间的传输方式提供了三个选项：`sockjs|ws|custom`，不同的选项对应着不同的浏览器端 `WebSocket` 实现方案，`this.getClientTransport()` 会根据配置选项的值返回对应的资源文件。默认配置下，传输方式为 `ws`，`webpack-dev-server/client/clients/WebSocketClient.js` 文件将成为浏览器端 `WebSocket` 的实现方案（其实就是浏览器自带的 `WebSocket` 方案）。

而用到 `__webpack_dev_server_client__` 的地方正是前面的 `socket.js` 文件：

```javascript
// webpack-dev-server/client/socket.js
var Client = __webpack_dev_server_client__;
var socket = function initSocket(url, handlers, reconnect) {
  // 这个 Client 是对浏览器自带的 WebSocket 的二次封装
  client = new Client(url);
  client.onOpen(function () {});
  client.onClose(function () {});
  client.onMessage(function (data) {
    var message = JSON.parse(data);
    if (handlers[message.type]) {
      handlers[message.type](message.data, message.params);
    }
  });
};
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

#### HotModuleReplacementPlugin

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

*   根据 `chunk/module` 的变动生成一份描述资源变更的 `JSON` 文件和用来更新资源的 `JS` 文件

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
      // 生成 JSON 文件，格式：{ c: [updatedChunkIds], r: [removedChunks], m: [removedModules]  }
      compilation.emitAsset(filename, source, {
        hotModuleReplacement: true,
        ...assetInfo,
      });
    }
  }
);
```

*   注入 `hmr runtime` 。

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

下面的 `hotCheck` 就是由 `hmr runtime` 所添加到 `module.hot` 上的 `check` 方法：

```javascript
// webpack/lib/hmr/HotModuleReplacement.runtime.js
function hotCheck(applyOnUpdate) {
  return (
    setStatus("check")
      // 1. 请求 xxx.hot-update.json 文件，获取资源变更状况
      .then(__webpack_require__.hmrM)
      .then(function (update) {
        return setStatus("prepare").then(function () {
          var updatedModules = [];
          blockingPromises = [];
          // 注意，这个数组用于存储处理更新的方法
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
                // 3. 处理变更
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

1.  `__webpack_require__.hmrM` 的逻辑是通过操作字符串动态生成的，它的作用是请求 `HMR` 生成的那份用于描述资源变更的 `JSON` 文件。具体函数体见下图：

    > `__webpack_require__.p` 逻辑在 `webpack/lib/runtime/AutoPublicPathRuntimeModule.js` 文件，`__webpack_require__.hmrF` 逻辑在`webpack/lib/RuntimePlugin.js` 文件

    ![\_\_webpack\_require\_\_.hmrM](http://47.106.154.218/share/webpack/dev-server/__webpack_require__.hmrM.png "__webpack_require__.hmrM")

2.  `__webpack_require__.hmrC` 逻辑如下：

    ```javascript
    __webpack_require__.hmrC.jsonp = function (
     chunkIds,
     removedChunks,
     removedModules,
     promises,
     applyHandlers,
     updatedModulesList
    ) {
      // 这个 applyHandler 是 internalApply 处理资源变更的核心逻辑所在
      applyHandlers.push(applyHandler);
      currentUpdateChunks = {};
      currentUpdateRemovedChunks = removedChunks;
      currentUpdate = removedModules.reduce(function (obj, key) {
        obj[key] = false;
        return obj;
      }, {});
      currentUpdateRuntime = [];
      chunkIds.forEach(function (chunkId) {
        if (
          __webpack_require__.o(installedChunks, chunkId) &&
          installedChunks[chunkId] !== undefined
        ) {
          // loadUpdateChun` 的后续流程是动态生成一个 `script` 标签来获取更新后的 chunk。
          promises.push(loadUpdateChunk(chunkId, updatedModulesList));
          currentUpdateChunks[chunkId] = true;
        }
      });
    };
    ```

    ![\_\_webpack\_require\_\_.hmrC.jsonp](http://47.106.154.218/share/webpack/dev-server/__webpack_require__.hmrC.jsonp.png "__webpack_require__.hmrC.jsonp")

    ![xxx.hot-update.js](http://47.106.154.218/share/webpack/dev-server/__webpack_require__.hmrC.js.png "xxx.hot-update.js")

    `self["webpackHotUpdatewebpack_dev_server"]` 同 `__webpack_require__.hmrM` 一样也是操作字符串生成的。它的作用就是将变更记录下来，以便后续的 `internalApply` 处理变更：

    ```javascript
    // 以上面的截图为例，这里的 chunkId = 'main'
    self["webpackHotUpdatewebpack_dev_server"] = (chunkId, moreModules, runtime) => {
        // moduleId = '.src/hello.js'
    	for(var moduleId in moreModules) {
    		if(__webpack_require__.o(moreModules, moduleId)) {
    			currentUpdate[moduleId] = moreModules[moduleId];
    			if(currentUpdatedModulesList) currentUpdatedModulesList.push(moduleId);
    		}
    	}
    	if(runtime) currentUpdateRuntime.push(runtime);
        // other code ...
    };
    ```

3.  在前面的 `JS` 文件和 `JSON` 文件都处理完成之后，进入 `internalApply` 的处理流程。`internalApply` 的逻辑简化后如下：

    ```javascript
    function internalApply(options) {
      applyInvalidatedModules();

      var results = currentUpdateApplyHandlers.map(function (handler) {
        // 这个 handler 就是之前在 __webpack_require__.hmrC.jsonp 函数中的被 push 进去的 applyHandler
        return handler(options);
      });
      currentUpdateApplyHandlers = undefined;

      var errors = results.map(function (r) {
          return r.error;
        })
        .filter(Boolean);

      // 注意，这里将 module.hot.status 的状态设置为 'abort'，和之前的 webpack/hot/dev-server.js 里的 catch 逻辑对应上，降级刷新页面
      if (errors.length > 0) {
        return setStatus("abort").then(function () {
          throw errors[0];
        });
      }

      // 移除旧的 module/chunk
      results.forEach(function (result) {
        if (result.dispose) result.dispose();
      });

      // 应用新的 module/chunk
      results.forEach(function (result) {
        if (result.apply) result.apply(reportError)
      });
    }
    ```

`applyHander` 会遍历 `currentUpdate` 中记录的所有 `moduleId`，通过 `getAffectedModuleEffects` 查找 `module` 本身及其所有父级，并根据 `module.hot.api` 的调用情况来决定后续是局部刷新还是降级刷新整个页面。以文章开头的例子来说，如果将 `index.js` 里的 `module.hot.accept` 删除再修改 `hello.js`，那么由于没有任何 `module` 接收变更，`devServer` 会降级使用刷新整个页面的方式来更新资源。

```javascript
// applyHandler 简化后代码
function applyHandler(options) {
  // other code ...
  function getAffectedModuleEffects(updateModuleId) {
    // other code ...
    while (queue.length > 0) {
      if (!module || (module.hot._selfAccepted && !module.hot._selfInvalidated))
        continue;
      if (module.hot._selfDeclined) {
        // ...
      }
      if (module.hot._main) {
        return {
          type: "unaccepted",
          chain: chain,
          moduleId: moduleId,
        };
      }
      for (var i = 0; i < module.parents.length; i++) {
        // ...
      }
    }
  }

  for (var moduleId in currentUpdate) {
    if (__webpack_require__.o(currentUpdate, moduleId)) {
      var newModuleFactory = currentUpdate[moduleId];
      var result;
      if (newModuleFactory) {
        result = getAffectedModuleEffects(moduleId);
      } else {
        result = {
          type: "disposed",
          moduleId: moduleId,
        };
      }
      var abortError = false;
      var doApply = false;
      var doDispose = false;
      switch (result.type) {
        case "self-declined":
          // ...
          break;
        case "declined":
          // ...
          break;
        case "unaccepted":
          if (options.onUnaccepted) options.onUnaccepted(result);
          if (!options.ignoreUnaccepted)
            abortError = new Error(
              "Aborted because " + moduleId + " is not accepted" + chainInfo
            );
          break;
        case "accepted":
          if (options.onAccepted) options.onAccepted(result);
          doApply = true;
          break;
        case "disposed":
          if (options.onDisposed) options.onDisposed(result);
          doDispose = true;
          break;
        default:
          throw new Error("Unexception type " + result.type);
      }
      if (abortError) {
        return {
          error: abortError,
        };
      }
      if (doApply) {
        // 记录待处理数据
      }
      if (doDispose) {
        // 记录待处理数据
      }
    }
  }

  return {
    dispose: function () {
      // other code ...
      currentUpdateRemovedChunks.forEach(function (chunkId) {
        delete installedChunks[chunkId];
      });
      currentUpdateRemovedChunks = undefined;
      delete __webpack_require__.c[moduleId];
      delete outdatedDependencies[moduleId];
    },
    apply: function (reportError) {
      // other code ...
 
      // 更新 module
      for (var updateModuleId in appliedUpdate) {
        if (__webpack_require__.o(appliedUpdate, updateModuleId)) {
          __webpack_require__.m[updateModuleId] = appliedUpdate[updateModuleId];
        }
      }

      // 更新 runtime
      for (var i = 0; i < currentUpdateRuntime.length; i++) {
        currentUpdateRuntime[i](__webpack_require__);
      }

      // 调用 accept 的回调
      for (var outdatedModuleId in outdatedDependencies) {
        var module = __webpack_require__.c[outdatedModuleId];
        for (var j = 0; j < moduleOutdatedDependencies.length; j++) {
          var dependency = moduleOutdatedDependencies[j];
          var acceptCallback = module.hot._acceptedDependencies[dependency];
          callbacks.push(acceptCallback);
        }
        for (var k = 0; k < callbacks.length; k++) {
          callbacks[k].call(null, moduleOutdatedDependencies);
        }
      }

      // 重新加载自身 module
      for (var o = 0; o < outdatedSelfAcceptedModules.length; o++) {
        var item = outdatedSelfAcceptedModules[o];
        var moduleId = item.module;
        item.require(moduleId);
      }

      return outdatedModules;
    },
  };
}
```

### 总结

![whole\_flow](http://47.106.154.218/share/webpack/dev-server/whole_flow.png)
