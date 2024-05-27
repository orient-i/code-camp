const express = require("express");
const WebSocket = require("ws");

class WebsocketServer {
  static heartbeatInterval = 1000;

  constructor(server) {
    this.server = server;
    this.clients = [];

    this.implementation = new WebSocket.Server({
      // 指定 WebSocket 服务器的路径
      path: "/ws",
      // 不跟踪客户端连接数（但其实还是会的，类本身还有个 clients 数组）
      clientTracking: false,
      // 使用外部的 HTTP/S 服务
      noServer: true,
    });

    this.server.server.on("upgrade", (req, sock, head) => {
      /*
       * See if a given request should be handled by this server.
       * By default, this method validates the pathname of the request, matching it against
       * the path option if provided. The return value, true or false, determines whether or
       * not to accept the handshake.
       */
      // console.log(req.url);
      if (!this.implementation.shouldHandle(req)) {
        console.log("dont handle");
        return;
      }

      /*
       * Handle a HTTP upgrade request. When the HTTP server is created internally or
       * when the HTTP server is passed via the server option, this method is called automatically.
       * When operating in "noServer" mode, this method must be called manually.
       */
      this.implementation.handleUpgrade(req, sock, head, (connection) => {
        this.implementation.emit("connection", connection, req);
      });
    });

    // 心跳检测
    // https://github.com/websockets/ws#how-to-detect-and-close-broken-connections
    const interval = setInterval(() => {
      this.clients.forEach((client) => {
        if (client.isAlive === false) {
          // 强行关闭链接
          client.terminate();
          return;
        }
        client.isAlive = false;
        client.ping(() => {});
      });
    }, WebsocketServer.heartbeatInterval);

    // client -> websocket object
    this.implementation.on("connection", (client) => {
      this.clients.push(client);
      client.isAlive = true;

      client.on("pong", () => {
        client.isAlive = true;
      });
      client.on("close", () => {
        this.clients.splice(this.clients.indexOf(client), 1);
      });
      client.on("error", (err) => {
        console.log(err.message);
      });
    });

    this.implementation.on("close", () => {
      clearInterval(interval);
    });
    this.implementation.on("error", (error) => {
      console.log("===== error =====", error);
    });
  }
}

class Server {
  constructor() {
    this.sockets = [];
  }

  createServer() {
    // https://stackoverflow.com/questions/8355473/listen-on-http-and-https-for-a-single-express-app
    this.server = require("http").createServer({}, express());
    this.server.on("connection", (socket) => {
      this.sockets.push(socket);
      socket.once("close", () => {
        this.sockets.splice(this.sockets.indexOf(socket), 1);
      });
    });
    this.server.on("error", (error) => {
      throw error;
    });
  }

  createWebSocketServer() {
    this.webSocketServer = new WebsocketServer(this);
  }

  async start() {
    this.createServer();
    await new Promise((resolve) => {
      this.server.listen({ port: 3000, host: undefined }, () => {
        resolve();
      });
    });
    this.createWebSocketServer();
  }
}

new Server().start();
