### 什么是 CommonJs 和 EsModule

CommonJs 是一种用于服务端(或者说非浏览器端) JavaScript 的模块化规范，它定义了一组用于导入和导出模块的语法和规则，通常用于 Node.js 环境。在 CommonJs 中，每个文件都是一个模块，并且模块的导入和导出都是通过特定的关键字来进行的。

EsModule 是 JavaScript 的官方模块化规范，在 ES 6 中引入。它的功能和 CommonJs 类似，同样定义了一组用于导入和导出模块的语法和规则，不过它只适用于浏览器端的 JavaScript。

### 为什么需要 CommonJs 和 EsModule

CommonJs 和 EsModule 都是一种模块化规范，要想知道为什么需要，或者说为什么会出现 CommonJs 和 EsModule，那就得先说说为什么 JavaScript 需要模块化。

```html
<body>
  <script src="./featureA.js"></script>
  <script src="./featureB.js"></script>
  <script src="./featureC.js"></script>
</body>
```

在各种前端框架出现的早期阶段，上面这种在不同文件实现不同功能(或者定义工具方法)，然后再在 html 文件中依次引入的写法是非常常见的。早期前端开发规模并不大，网页的功能也都很简单，甚至可以说是纯展示页面，所以这种写法问题也不大。但随着网页功能愈发复杂，引入的 JavaScript 文件数量陡增之后，有两个问题就不得不重视起来了。

#### 全局污染

假设张三在 featureA.js 文件中编写了如下代码：

```javascript
// featureA.js
var game = "Baldur's Gate 3";
```

然后张三在 featureC.js 文件中写了如下代码来辅助自测：

```javascript
// featureC.js
console.log(game);
```

结果张三在控制台发现，打印结果竟然是个函数!!! 张三仔细地在自己写的 feaureA.js 文件中检查了一遍，没发现任何异常。百思不得其解时，张三发现同期开发的李四在 html 文件中加了个新文件 featureB.js，并且在这个文件中存在下面这样一段代码：

```javascript
// featureB.js
function game() {}
```

这下真相大白了，原来是李四的定义将张三的定义给覆盖了。

> Tips: 关于这个例子，可以通过立即执行函数来解决变量污染问题。不过真实开发场景中，业务功能的实现，错综复杂，不可能啥都用立即执行函数。

#### 依赖管理

正常情况下，执行 JavaScript 的顺序就是 script 标签的排列顺序。当 featureC.js 依赖于 featureA.js 中的某些变量或者函数时，那么 featureC.js 必须要在 featureA.js 之后引入才能正常实现功能。也就是说前端开发者需要手动维护一份 JavaScript 文件之间的依赖关系，以确保各个 JavaScript 文件能够正常工作。

庞大的项目规模带来的必定是数量庞大的 script 引入标签，维护如此多的依赖关系对前端开发(特别是项目的新成员)来说，是个不小的负担。而且如果 featureC.js 和 featureA.js 互有依赖的话，那就只能再抽出一个新文件或者全都挪到 featureA.js 文件中。随着项目的迭代，长此以往，文件数量大概率会越来越多，排在前面的文件里面的逻辑也大概率会越来越多且复杂。

#### 小结

正因为有这些问题的存在，模块化刻不容缓。

### CommonJs 的用法和相关原理

CommonJs 是由一群社区成员共同制定的规范，最早于 2009 年发布，它的出现弥补了 JavaScript 在模块化方面的缺陷。

#### 用法

CommonJs 使用 exports 或 module.exports 来导出模块，使用 require 来导入模块。

```javascript
// a.js 导出模块
const game = "Baldur's Gate 3";
module.exports = function getFavoriteGames() {
  return game;
};

// b.js 导出模块
exports.name = "zs";

// c.js 导入模块
const getFavoriteGames = require("./a.js");
const { name } = require("./b.js");
function selfIntroduce() {
  // prettier-ignore
  console.log(`my name is ${name}, and my favorite games are ${getFavoriteGames()}`);
}
selfIntroduce();
```

运行 c.js 之后，可以看到终端如愿输出结果：

```shell
my name is zs, and my favorite games are Baldur's Gate 3
```

可以看到 CommonJs 的用法还是很简单的，那么它是如何解决前面提到的两个弊端的呢？为什么 module.exports 导出的可以直接通过 require 拿到，而 exports 导出的却要解构之后才能拿到导出的内容呢？此外，还有一个需要注意的点：使用 exports 导出模块时，只能使用 exports.xxx = xxx 的格式，不能使用 exports = xxx 的格式，理由请参考后面的 require 流程分析。

#### 原理

module、exports、require，这三个变量是 CommonJs 的关键，它们分别代表“当前文件模块的信息”、“当前模块导出的属性”、“引入模块的方法”。

##### 模块导出

在代码编译的过程中，CommonJs 会对代码进行包装处理以避免命名冲突和全局污染，下面是之前 a.js 的代码经过处理之后的样子。

```javascript
(function (exports, require, module, __filename, __dirname) {
  const game = "Baldur's Gate 3";
  module.exports = function getFavoriteGames() {
    return [game];
  };
});
```

而包装方法的本质和执行过程大致如下所示：

```javascript
// 抹平文件内容在操作系统之间的差异(mac 有个零宽符)
function stripBOM(content) {
  // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
  // because the buffer-to-string conversion in `fs.readFileSync()`
  // translates it to FEFF, the UTF-16 BOM.
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }
  return content;
}

// 包装文件内容
function wrapper(content) {
  // prettier-ignore
  return "(function (exports, require, module, __filename, __dirname) {" + stripBOM(content) + "\n})";
}

// 将经过包装函数处理的文件内容字符串转换成可执行的 Js 代码，并传入 module.exports、require 等参数触发代码执行
function compile(path) {
  const content = wrapper(fs.readFileSync(path, "utf8"));
  // prettier-ignore
  runInThisContext(content)(module.exports, require, module, __filename, __dirname);
}
```

`runInThisContext` 可以理解成 eval，结合入参和前面经过包装后的 a.js 代码来看，可以发现下面两点：

1. 用于导出模块的 module.exports 和 exports 是等同的，它们都指向 module(此 module 是记录当前 Js 文件信息的对象)的 exports 属性：

   ```javascript
   // b.js
   exports.name = "zs";
   console.log(module.exports === exports);
   ```

   在 b.js 文件添加判定之后，使用 node 运行文件：

   ```shell
   node b.js

   true
   ```

2. 源码文件中导出的模块，全都挂在用于记录源码文件信息的 module 对象的 exports 属性上。

##### 模块加载

既然代码中所有导出的内容都挂在 module 对象的 exports 属性上，那么用于模块加载的 require 显然必定会去读取这个属性，下面是一个简化版本的 require 函数的伪代码实现：

```javascript
function require(path) {
  // 检查模块缓存，如果模块已经被加载过，直接返回缓存的模块
  const cachedModule = Module._cache[path];
  if (cachedModule) {
    return cachedModule.exports;
  }
  // 如果是一个全新的模块，则创建一个新的模块对象
  const module = {
    id: path,
    exports: {},
    loaded: false,
    ...
  };
  // 将新的 module 记录到 Module 缓存之中
  Module._cache[path] = module;
  // 读取源码文件内容，转换并执行源码
  compile(path);
  // 标记模块已加载
  module.loaded = true;
  // 返回模块的导出对象
  return module.exports;
}
```

Module 是 Node.js 用于描述文件信息的构造函数(或者说类)。从上面的伪代码可以看出 require 的执行过程大致如下所示：

1. 判定是否有缓存，如果有缓存，则直接返回缓存的结果。
2. 创建一个全新的 module 对象并记录到 Module 上，然后再加载源码文件。这让 require 在循环引用时不致于陷入无限循环：

   ```javascript
   // loop-require-d.js
   const eInfo = require("./loop-require-e");
   console.log(`eInfo is ${JSON.stringify(eInfo)}`);
   module.exports = { msg: "I'm a string from loop-require-d.js" };

   // loop-require-e.js
   const dInfo = require("./loop-require-d");
   console.log(`dInfo is ${JSON.stringify(dInfo)}`);
   module.exports = { msg: "I'm a string from loop-require-e.js" };

   // loop-require-f.js
   require("./loop-require-d");
   require("./loop-require-e");
   ```

   上面的例子中，loop-require-d.js 和 loop-require-e.js 相互引用，使用 node 运行 loop-require-f.js 文件之后，可以看到终端正常输出了结果，并没有陷入无限循环的陷阱中：

   ```shell
   dInfo is {}
   eInfo is {"msg":"I'm a string from loop-require-e.js"}
   ```

   我们来逐步分析下这个结果的出现过程：

   - 运行 loop-require-f.js 文件，第一行代码执行，引入 loop-require-d.js 文件
   - loop-require-d.js 文件第一次加载，没有缓存，于是创建了个新的 module(称为 DModule) 代表 loop-require-d.js 文件。
   - DModule 创建完成后，被记录到 Module.\_cache 里，此时 DMoule.exports 还是个空对象。
   - 读取 loop-require-d.js 文件内容，转换并执行文件代码。loop-require-d.js 文件第一行代码触发执行，引入 loop-require-e.js 文件
   - loop-require-e.js 文件第一次加载，没有缓存，于是也创建了个新的 module(称为 EModule) 代表 loop-require-e.js 文件。
   - 读取 loop-require-e.js 文件内容，转换并执行文件代码。loop-require-e.js 文件第一行代码触发执行，引入 loop-require-d.js 文件
   - 由于 loop-require-d.js 文件已经被记录到 Module.\_cache 里了，所以会直接返回 DMoule.exports，也就是个空对象。
   - 接着 loop-require-e.js 的 console.log 触发，终端打印 dInfo，最后再导出自己的模块。至此，loop-require-e.js 加载过程结束。
   - loop-require-d.js 文件执行流程继续，console.log 触发，终端打印 eInfo ，最后导出自己的模块。至此，loop-require-d.js 加载过程也结束了。
   - 然后回到最开始，loop-require-f.js 文件第二行代码触发，加载 loop-require-e.js。
   - 由于 loop-require-e.js 已经加载过了，所以直接触发返回 module.exports。故，dInfo 只打印了一次。

3. 将 module 对象的 loaded 属性标记为 true，表示该模块加载完成
4. 返回 module.exports。

现在，我们来分析下前面提到的注意事项：使用 exports 导出模块时，只能使用 `exports.xxx = xxx` 的格式而不能用 `exports = xxx` 的格式。

默认状态下，在代码中使用的 exports，这个形参变量，它指向的地址空间和 module.exports 的地址空间是同一个。用 `exports.xxx = xxx` 导出模块就是在往 module.exports 指向的那个地址空间添加东西，而 `exports = xxx` 这种格式，其实是给 exports 这个形参变量指定了一个全新的地址空间，require 并不知道这个全新的地址空间，它读取的一直是 module.exports 指向的那个地址空间，所以后面这种导出格式是无效的。

##### Q & A

为什么在提出 exports 这种导出方式之后，又引入 module.exports 这种导出方式？

exports 导出的必定是个对象，引入时需要结构，module.exports 更加灵活。

### EsModule 的用法和相关原理

EsModule 是由官方在 ECMAScript 2015 中引入的模块化规范，于 2015 年 6 月发布。

#### 用法

#### 原理

### CommonJs 和 EsModule 的差异

### 参考资料

[「万字进阶」深入浅出 CommonJs 和 Es Module](https://juejin.cn/post/6994224541312483336)

```

```
