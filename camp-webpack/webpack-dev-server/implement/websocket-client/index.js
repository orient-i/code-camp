var retries = 0;
var maxRetries = 10;
var client = null;

var socket = function initSocket(url, handlers, reconnect) {
  client = new WebSocket(url);
  client.onopen = () => {
    retries = 0;
    if (typeof reconnect !== "undefined") {
      maxRetries = reconnect;
    }
  };

  client.onclose = () => {
    if (retries === 0) {
      handlers.close();
    }

    // Try to reconnect.
    client = null;

    // After 10 retries stop trying, to prevent logspam.
    if (retries < maxRetries) {
      var retryInMs = 1000 * Math.pow(2, retries) + Math.random() * 100;
      retries += 1;
      log.info("Trying to reconnect...");
      setTimeout(function () {
        socket(url, handlers, reconnect);
      }, retryInMs);
    }
  };

  client.onmessage = (e) => {
    var message = JSON.parse(e.data);
    if (handlers[message.type]) {
      handlers[message.type](message.data, message.params);
    }
  };
};

socket("ws://localhost:3000/ws", {}, 10);
