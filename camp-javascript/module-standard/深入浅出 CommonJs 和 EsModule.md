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

##### 用法

CommonJs 使用 exports 或 module.exports 关键字来导出模块，使用 require 关键字来导入模块。

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

可以看到 CommonJs 的用法还是很简单的，那么它是如何解决前面提到的两个弊端的呢？为什么 module.exports 导出的可以直接通过 require 拿到，而 exports 导出的却要解构之后才能拿到导出的内容呢？

##### 原理

### EsModule 的用法和相关原理

### CommonJs 和 EsModule 的差异

### 参考资料

[「万字进阶」深入浅出 CommonJs 和 Es Module](https://juejin.cn/post/6994224541312483336)
