const WEBPACK_PACKAGE = process.env.WEBPACK_PACKAGE || "webpack";
const WEBPACK_DEV_SERVER_PACKAGE =
  process.env.WEBPACK_DEV_SERVER_PACKAGE || "webpack-dev-server";
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
        // 加载 webpack
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
        // 创建 compiler
        const compiler = await cli.createCompiler(webpackCLIOptions);
        // 获取配置文件中的 devServer 配置
        const devServerOptions = Object.assign(
          {},
          compiler.options.devServer || {}
        );
        // 实例化 Server
        const server = new DevServer(devServerOptions, compiler);
        // 启动 webpack-dev-server
        await server.start();
      }
    );
  }
}

class Server {
  addAdditionalEntries(compiler) {
    const additionalEntries = [];
    // webSocketURLStr 是根据 devServer 配置选项生成的，比如 ?protocol=ws%3A&hostname=0.0.0.0&port=3000&pathname=%2Fws&logging=info&overlay=true&reconnect=10&hot=true&live-reload=true
    additionalEntries.push(
      `${require.resolve("../client/index.js")}?${webSocketURLStr}`
    );
    if (this.options.hot === "only") {
      additionalEntries.push(require.resolve("webpack/hot/only-dev-server"));
    } else if (this.options.hot) {
      additionalEntries.push(require.resolve("webpack/hot/dev-server"));
    }

    const webpack = compiler.webpack || require("webpack");

    // 使用 webpack 内置插件 EntryPlugin 将前面两个文件添加到构建流程之中
    for (const additionalEntry of additionalEntries) {
      new webpack.EntryPlugin(compiler.context, additionalEntry, {
        name: undefined,
      }).apply(compiler);
    }
  }

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
    this.setupApp();
    this.setupHostHeaderCheck();
    this.setupDevMiddleware();
    this.setupBuiltInRoutes();
    this.setupWatchFiles();
    this.setupWatchStaticFiles();
    this.setupMiddlewares();
    this.createServer();
  }

  async start() {
    // 修正 devServer 的配置项、添加默认配置
    await this.normalizeOptions();
    // 一系列准备工作
    await this.initialize();
    // 设置开发服务器的启动端口和监听地址
    const listenOptions = { host: this.options.host, port: this.options.port };

    // 启动开发服务器
    await new Promise((resolve) => {
      this.server.listen(listenOptions, () => {
        resolve();
      });
    });

    // 创建服务端的 WebSocket
    this.createWebSocketServer();
  }
}
