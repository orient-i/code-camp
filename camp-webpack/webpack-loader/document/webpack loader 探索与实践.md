### 前言

Webpack Loader 作为 Webpack 扩展和处理模块的两大核心概念之一，本篇文章围绕以下六个问题对 Webpack Loader 进行阐述说明。

1.  Loader 是什么？
2.  为什么需要 Loader？
3.  同步 Loader 和异步 Loader
4.  什么是 Pitching Loader？
5.  Loader 的运行原理
6.  Loader 和 Plugin 的区别

### Loader 的本质

Loader 的本质很简单，就是一个导出内容为函数的 Js 模块。它接收资源文件内容或者上一个 loader 的处理结果作为参数，这种特性使得 Webpack 能够以结构清晰、功能分割明确的 loader chain 方式来扩展处理某种模块。

```javascript
/**
 *
 * @param {string|Buffer} content 源文件的内容
 * @param {object} [map] 可以被 https://github.com/mozilla/source-map 使用的 SourceMap 数据
 * @param {any} [meta] meta 数据，可以是任何内容
 */
function webpackLoader(content, map, meta) {
  // some code
}

module.exports = webpackLoader;
```

下面是一个简易 demo，可以看到在执行 `npm run build` 打包命令之后，`simple-loader` 成功触发执行了：
![demo](https://s11.ax1x.com/2024/02/27/pFdde8e.png)

### Loader 的作用

默认情况下，Webpack 只能理解 Javascript 和 JSON 文件。而现如今的前端项目愈发复杂，使用到的文件资源类型远不止这两种，比如 css、less、scss、png 等等。Loader 可以帮助 Webpack 解析这些陌生的文件资源，还可以在解析过程中做些压缩优化处理，以此来增强 Webpack 的功能。

### 同步 Loader 和异步 Loader

同步 Loader 和异步 Loader 在代码上唯一的不同之处在于函数最后的处理语句上。

同步 Loader 使用 `return` 或者 `this.callback` 作为函数的最后处理，而异步 Loader 则使用 `this.async` 作为函数的最后处理。适当修改前面的 demo1，得到如下的 demo2。

*目录结构、`webpack.config.js`、入口文件、`html` 模板如下图：*

![demo2](http://47.106.154.218/share/webpack/loader/sync_async_loader.png)

异步 Loader 代码：

```javascript
// index.js
const fs = require("node:fs");

function asyncLoader(content, map, meta) {
  // callback 的参数格式和同步 Loader 里的 this.callback 一样
  const callback = this.async();
  fs.readFile(`${__dirname}/script.txt`, "utf-8", (err, data) => {
    callback(null, content + data, map, meta);
  });
}

module.exports = asyncLoader;

// script.txt
const asyncDiv = document.createElement("div");
asyncDiv.innerHTML = "this is content from async loader!";
app.appendChild(asyncDiv);
```

同步 Loader 代码：

```javascript
// sync-loader-one
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

// sync-loader-two
function syncLoaderTwo(content, map, meta) {
  const str = `const syncDiv = document.createElement("div");
  syncDiv.innerHTML = "this is content from sync loader two!";
  app.appendChild(syncDiv);\n`;
  return content + str;
}

module.exports = syncLoaderTwo;
```

执行 `npm run build`，浏览器打开打包之后的产物，可以看到三个自定义 Loader 全部生效了：

![effect](http://47.106.154.218/share/webpack/loader/sync_async_loader_effect.png)

### Pitching Loader

Loader 本质上是一个导出内容为函数的 Js 模块，而在这个被导出的函数上，还有一个 `pitch` 属性，它的值也是一个函数，这个函数被称为 `pitching loader`，它会在 `loader` 之前执行，它同样有三个参数：

```javascript
/**
 * @remainingRequest 剩余请求
 * @precedingRequest 前置请求
 * @data 数据对象，可以连通 normal loader
 */
webpackLoader.pitch = function (remainingRequest, precedingRequest, data) {
  // some code
};
```

`data` 参数可用于数据传递，它和 Loader 函数中的 `this.data` 是对应的。如果在 `pitching loader` 中往 `data` 对象上添加数据，那么后续可以在 `loader` 函数体中通过 `this.data` 获取到添加的数据。\
`remainingRequest` 和 `precedingRequest` 的 value 格式形似 `inline-loader` 的使用方式，由 `loader` 的绝对路径构成，每个 `loader` 之间以 `!` 分割，唯一不同的是 `remainingRequest` 会在最后一个 `loader` 的路径后面再拼接上待处理文件的绝对路径。来看 demo3：

```javascript
// aLoader
function aLoader(content, map, meta) {
  console.log("\nI am a loader, and my data is", this.data, "\n");
  return content;
}

aLoader.pitch = function (remainingRequest, precedingRequest, data) {
  data.msg = "Hi loader, I am your pitch part";
};

module.exports = aLoader;

// bLoader
function bLoader(content, map, meta) {
  return content;
}
bLoader.pitch = function (remainingRequest, precedingRequest, data) {
  console.log("===== remainingRequest =====", remainingRequest);
  console.log("===== precedingRequest =====", precedingRequest);
};
module.exports = bLoader;

// cLoader
function cLoader(content, map, meta) {
  return content;
}
cLoader.pitch = function (remainingRequest, precedingRequest, data) {};
module.exports = cLoader;
```

对 `webpack.config.js` 配置文件稍作修改：

```javascript
module: {
  rules: [
    {
      test: /\.js$/,
      use: ["a-loader", "b-loader", "c-loader"],
    },
  ],
},
```

执行 `npm run build` 打包命令之后，可以看到 `b pitching loader` 的参数 `remainingRequest` 和 `precedingRequest` 的值：

```javascript
> demo3@1.0.0 build
> webpack

===== remainingRequest ===== /Users/shopee/Documents/development/webpack-loader/demo3/loaders/c-loader/index.js!/Users/shopee/Documents/development/webpack-loader/demo3/src/index.js
===== precedingRequest ===== /Users/shopee/Documents/development/webpack-loader/demo3/loaders/a-loader/index.js

I am a loader, and my data is { msg: 'Hi loader, I am your pitch part' } 

asset main.js 135 bytes [compared for emit] (name: main)
./src/index.js 51 bytes [built] [code generated]
webpack 5.91.0 compiled successfully in 77 ms
```

仔细观察 `remainingRequest` 和 `precedingRequest` 的值，不难发现一个奇怪的点：按照配置文件中 `["a-loader", "b-loader", "c-lodaer"]` 的顺序，当 `b-loader` 执行时，`c-loader` 已经执行完毕了，怎么 `remainingRequest` 的值会是 `c-loader`？
之所以会出现这种情况，是因为 `loader chain` 上的 `pitching loader` 会以 `loader` 执行顺序相反的顺序执行，等待 `pitching loader` 全部执行完成之后，才会开始执行 `loader`。将上述 `demo` 略作修改：

```javascript
// a-loader
function aLoader(content, map, meta) {
  console.log("=== a loader execute ===");
  return content;
}
aLoader.pitch = function (remainingRequest, precedingRequest, data) {
  console.log("=== a pitching loader execute ===");
};
module.exports = aLoader;

// b-loader
function bLoader(content, map, meta) {
  console.log("=== b loader execute ===");
  return content;
}
bLoader.pitch = function (remainingRequest, precedingRequest, data) {
  console.log("=== b pitching loader execute ===");
};
module.exports = bLoader;

// c-loader
function cLoader(content, map, meta) {
  console.log("=== c loader execute ===");
  return content;
}
cLoader.pitch = function (remainingRequest, precedingRequest, data) {
  console.log("=== c pitching loader execute ===");
};
module.exports = cLoader;
```

执行 `npm run build`，可以看到控制台信息如期打印：

```javascript
> demo4@1.0.0 build
> webpack

=== a pitching loader execute ===
=== b pitching loader execute ===
=== c pitching loader execute ===
=== c loader execute ===
=== b loader execute ===
=== a loader execute ===
asset main.js 165 bytes [compared for emit] (name: main)
./src/index.js 81 bytes [built] [code generated]
webpack 5.91.0 compiled successfully in 76 ms
```

![pitch-loader-chain](http://47.106.154.218/share/webpack/loader/pitch_loader_chain.png)

除去执行上的特殊性之外, `pitching loader` 还有一个熔断机制。\
将 `a-loader` 和 `b-loader` 的 `pitching-loader` 做如下修改：

```javascript
// a-loader
function aLoader(content, map, meta) {
  console.log("=== a loader execute ===");
  console.log("=== a loader content is ===", content, "\n");
  return content;
}

// b-loader
bLoader.pitch = function (remainingRequest, precedingRequest, data) {
  console.log("=== b pitching loader execute ===");
  return "'b pitching loader'";
};
```

执行 `npm run build`，控制台信息如下：

```javascript
> demo4@1.0.0 build
> webpack

=== a pitching loader execute ===
=== b pitching loader execute ===
=== a loader execute ===
=== a loader content is === 'msg from b pitch loader' 

asset main.js 1.41 KiB [compared for emit] (name: main)
./src/index.js 42 bytes [built] [code generated]
webpack 5.91.0 compiled successfully in 75 ms
```

从上面的输出结构可知：当 `loader chain` 上的某个 `pitching loader` 返回非 `undefined` 时，`loader runner` 会立马掉头，并将这个 `pitching loader` 的返回值作为 `content` 参数注入到前一个 `loader` 中。
![pitch-loader-fusing](http://47.106.154.218/share/webpack/loader/pitch_loader_fusing.png)

PS: Rule.enforce 配置项也会改变 loader 的执行顺序，搭配 inline loader 的使用方式，当一个文件同时被 pre Loader、normal Loader（enforce不设定 value 即表示 normal loader）、inline loader、post Loader 处理时，这些 loader 的执行顺序如下：\
![enforce-loader](http://47.106.154.218/share/webpack/loader/enfore_loader.png)

### Loader 的运行原理

在 demo3 的根目录下添加调试文件夹：

```javascript
// .vscode/launch.json
{
  // Use IntelliSense to learn about possible attributes.
  // Hover to view descriptions of existing attributes.
  // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Webpack Debug",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "build"]
    }
  ]
}
```

再在 `loader chain` 上最早触发的 `a pitch loader` 上打个断点，通过 vscode 提供的 debug 功能，可以清楚地在 loader 的调用栈信息中看到 Webpack 处理 loader 的核心库 —— [loader-runner](https://github.com/webpack/loader-runner)。\
![webpack-loader-debug](http://47.106.154.218/share/webpack/loader/webpack_loader_debug.png)\
Webpack 会通过 `setImmediate` 开启 `compilation` 上所记录的依赖模块的处理流程。`compilation` 会通过 `_buildModule` 解析模块源代码，将其转换成可执行的 `chunk`。调用 loader 的时机即在触发 `compilation` 的 `_buildModule` 钩子之后。Webpack 会在 `webpack/lib/NormalModule.js` 中，调用 runLoaders 运行 loader：\
![webpack-loader-runner](http://47.106.154.218/share/webpack/loader/webpack_loader_runner.png)

`loader-runner` 中所创建的 `loader object`：

```javascript
function createLoaderObject(loader) {
	var obj = {
		path: null,                 // loader 的绝对路径
		query: null,
		fragment: null, 
		options: null,              // loader 的配置项，对应 webpack.config.js 里给 loader 设定的 options
		ident: null,
		normal: null,               // loader 的 normal 函数
		pitch: null,                // loader 的 pitch 函数
		raw: null,                  // 表示 loader 是否需要接收原始的 Buffer 类型数据。
		data: null,                 // loader 的数据对象，用于在 loader 之间传递数据
		pitchExecuted: false,       // loader 的 pitch 函数是否已经执行
		normalExecuted: false       // loader 的 normal 函数是否已经执行
	};
	
	// ...
	
	return obj;
}
```

`runLoader` 部分代码：

```javascript
exports.runLoaders = function runLoaders(options, callback) {
    // ...
    
    // prepare loader objects
	loaders = loaders.map(createLoaderObject);
	
	// ...
	
	// loaderContext 即是 loader 函数体中的 this
	loaderContext.loaderIndex = 0;
	loaderContext.loaders = loaders;
	loaderContext.resourcePath = resourcePath;
	
	//...
	Object.defineProperty(loaderContext, "remainingRequest", {
		enumerable: true,
		get: function() {
			if(loaderContext.loaderIndex >= loaderContext.loaders.length - 1 && !loaderContext.resource)
				return "";
			return loaderContext.loaders.slice(loaderContext.loaderIndex + 1).map(function(o) {
				return o.request;
			}).concat(loaderContext.resource || "").join("!");
		}
	});
	Object.defineProperty(loaderContext, "data", {
		enumerable: true,
		get: function() {
		    // 每次访问 this.data，实际访问的是 loader 本身对应的 loader object 上的 data
		    // 这也是为什么 loader 的 normal 和 pitch 能实现数据互通的原因
		    // 因为对应的都是同一个 loader object
			return loaderContext.loaders[loaderContext.loaderIndex].data;
		}
	});
}
```

`runSyncOrAsync` 部分代码

```javascript
function runSyncOrAsync(fn, context, args, callback) {
	var isSync = true;
	var isDone = false;
	var isError = false; // internal error
	var reportedError = false;
	context.async = function async() {
		if(isDone) {
			if(reportedError) return; // ignore
			throw new Error("async(): The callback was already called.");
		}
		isSync = false;
		return innerCallback;
	};
	var innerCallback = context.callback = function() {
		if(isDone) {
			if(reportedError) return; // ignore
			throw new Error("callback(): The callback was already called.");
		}
		isDone = true;
		isSync = false;
		try {
		    // 异步 loader 之所以能够触发完整的 loader chain，关键在这里。
		    // 异步操作完成之后，this.async() 的返回值的调用，使得 loader chain 成功往下触发
			callback.apply(null, arguments);
		} catch(e) {
			isError = true;
			throw e;
		}
	};
	try {
		var result = (function LOADER_EXECUTION() {
			return fn.apply(context, args);
		}());
		/* 
    		注意：如果是异步 loader，那么函数的执行到这一步就结束了，后面的代码都不会执行。
    	*/
		if(isSync) {
			isDone = true;
			if(result === undefined)
				return callback();
			if(result && typeof result === "object" && typeof result.then === "function") {
				return result.then(function(r) {
					callback(null, r);
				}, callback);
			}
			return callback(null, result);
		}
	} catch(e) {
		if(isError) throw e;
		if(isDone) {
			// loader is already "done", so we cannot use the callback function
			// for better debugging we print the error on the console
			if(typeof e === "object" && e.stack) console.error(e.stack);
			else console.error(e);
			return;
		}
		isDone = true;
		reportedError = true;
		callback(e);
	}

}
```

### Loader 和 Plugin 的区别

1.  Loader，核心在于“转换”。它帮助 Webpack 将一个文件转换成另一个文件。
2.  Plugin，核心在于“扩展”。它针对的是 Webpack 的整个打包过程，它并不直接操作文件，而是基于事件机制工作。它会监听 Webpack 打包过程中的某些关键节点，然后再在这些节点执行特定的任务。

### 参考资料

<https://stackoverflow.com/questions/32029351/why-are-loaders-read-from-right-to-left-in-webpack>\
<https://juejin.cn/post/7037696103973650463>\
<https://juejin.cn/post/7157739406835580965>\
<https://juejin.cn/post/6992754161221632030>\
<https://febook.hzfe.org/awesome-interview/book3/engineer-webpack-loader>
