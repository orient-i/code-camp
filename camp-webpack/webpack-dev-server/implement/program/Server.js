class Server {
  setupHooks() {
    this.compiler.hooks.done.tap("webpack-dev-server", (stats) => {
      if (this.webSocketServer) {
        // 将编译完成后的统计数据发送给连接到服务端 websocket 的客户端(https://webpack.js.org/api/stats/)
        this.sendStats(this.webSocketServer.clients, this.getStats(stats));
      }

      this.stats = stats;
    });
  }
}
