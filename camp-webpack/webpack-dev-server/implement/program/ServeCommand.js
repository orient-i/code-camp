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
