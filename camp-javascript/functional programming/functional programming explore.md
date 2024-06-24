### 前言

早在 1950 年代，随着 Lisp 语言的创建，函数式编程（Functional Programming，简称 FP）就已经开始出现在大家视野。直到近些年，函数式以其优雅、简单的特点开始重新风靡整个编程界，主流语言在设计的时候无一例外都会更多地参考函数式特性，Java8 开始支持函数式编程。

而在前端领域，同样能看到很多函数式编程的影子：ES6 新增了箭头函数，Redux 引入 Elm 思路降低 Flux 的复杂性，React16.6 开始推出 React.memo()，使 pure functional components 成为可能，16.8 开始主推 Hook，建议使用 pure function 编写组件......

这些无一例外地说明，函数式编程这种古老的编程范式并没有随着岁月而褪去其光彩，反而愈加生机勃勃。

### 初窥

概念说的再多，不如例子直观。假设现在有这么个需求，有一组人名存在数组中，现在需要对这个结构进行一些修改，把字符串数组变成一个对象数组以方便后续扩展，并对人名做一些转换处理：

```javascript
// before
["john-reese", "harold-finch", "sameen-shaw"];

// after
[{ name: "John Reese" }, { name: "Harold Finch" }, { name: "Sameen Shaw" }];
```

##### 命令式

命令式编程是一种关注实现过程的编程范式：

1. 定义一个临时变量 newArr。
2. 循环遍历数组。
3. 在遍历的过程中，通过 - 切割字符串
4. 将名字的首位取出来大写，然后拼接剩余的部分。
5. .......
6. 最后得到结果。

代码实现如下：

```javascript
const arr = ["john-reese", "harold-finch", "sameen-shaw"];
const newArr = [];
for (let i = 0, len = arr.length; i < len; i++) {
  let name = arr[i];
  let names = name.split("-");
  let newName = [];
  for (let j = 0, naemLen = names.length; j < naemLen; j++) {
    let nameItem = names[j][0].toUpperCase() + names[j].slice(1);
    newName.push(nameItem);
  }
  newArr.push({ name: newName.join(" ") });
}
return newArr;
```

命令式编程虽然能完成任务，但是却不易于维护。过程中掺杂了大量逻辑，需要从头读到尾才能知道具体做了什么，一旦出现问题很难定位。

##### 函数式

下面是函数是编程的思路：

1. 需要一个函数将 `String 数组` 转换成 `Object 数组`。
   <img src="https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/9/5/16d00f43665b08f4~tplv-t2oaga2asx-jj-mark:3024:0:0:0:q75.awebp" />
2. 需要一个实现将 `String` 转换成 `Object`。
   <img src="https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/9/5/16d00f43662b192f~tplv-t2oaga2asx-jj-mark:3024:0:0:0:q75.awebp" />
3. 由于字符串的格式并不统一，所以可以先统一字符串格式，再来实现转换。
   <img src="https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/9/5/16d00f43661763ce~tplv-t2oaga2asx-jj-mark:3024:0:0:0:q75.awebp" />
4. 统一字符格式的 `capitalizeName` 可以是几个方法的组合，每个方法负责一部分的处理逻辑（`split`, `join`, `capitalize`）。
   <img src="https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/9/5/16d00f43667a603a~tplv-t2oaga2asx-jj-mark:3024:0:0:0:q75.awebp" />

至此，基本思路分析完成，下面是代码：

```javascript
// 先忽略 curry 和 compose
const capitalize = (x) => x[0].toUpperCase() + x.slice(1).toLowerCase();

const genObj = curry((key, x) => {
  let obj = {};
  obj[key] = x;
  return obj;
});

const capitalizeName = compose(join(" "), map(capitalize), split("-"));
const convert2Obj = compose(genObj("name"), capitalizeName);
const convertName = map(convert2Obj);

convertName(["john-reese", "harold-finch", "sameen-shaw"]);
```

不难发现，函数式编程的思维过程和命令式编程差别很大，它并不着重于具体的实现过程，它的着眼点是<b>函数</b>。它强调的是如何通过函数的组合变换去解决问题，而不是通过写什么样的语句去解决问题。当代码量级越来越大是，函数式编程这种拆分和组合的方式会带来极大的便利。

### 理念

前面我们已经初窥了函数式编程，简单体验了下它的思路，现在让我们来看看函数式编程到底是什么。

“函数”这个东西在我们很小的时候就已经开始接触了，一元函数、二元一次函数等等。根据学术上的定义，函数是一种描述集合与集合之间的转换关系，每一个输入通过函数之后都会返回一个输出值。

<img src="https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/9/5/16d00f436bd171df~tplv-t2oaga2asx-jj-mark:3024:0:0:0:q75.awebp" />

所以，<b>函数</b>本质上是一个<b>关系</b>，或者说是一种<b>映射</b>。而这种映射关系是可以组合的：如果一个函数的输出类型可以匹配另一个函数的输入类型要求，那么它们就可以组合在一起。

```javascript
const convert2Obj = compose(genObj("name"), capitalizeName);
```

前面写的 `convert2Obj` 就完成了映射关系的组合，实现了数据从 `String -> String -> Object` 的转换流程。这种映射关系的组合就相当于数学上的复合运算：`y = g(f(x))`。

在代码世界中，需要我们处理的其实也就是“数据”和“关系”，而关系就是函数。所谓的<b>编程</b>其实就是在寻找一种<b>映射关系</b>，一旦找到了关系，问题也就解决了，剩下的工作也就是让数据流过这种关系，然后转换成另一个数据罢了。

这其实非常像<b>流水线</b>，把输入当原料，把输出当产品。<b>数据可以不断地从一个函数的输入口进入，然后从输出口输出，接着又再次流向另一个函数的输入口。如此往复，直到最后得到我们想要的输出结果。</b>

<img src="https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/9/5/16d00f438a16ebfe~tplv-t2oaga2asx-jj-mark:3024:0:0:0:q75.awebp" />

<span style="color: #2673dd">函数式编程是什么？它是一种强调在编译过程中把更多的关注点放在如何去构建关系的编程范式。</span>通过构建一条高效的构建流水线，一次性解决所有问题，而不是把精力分散在不同的加工厂中来回奔波传递数据。

<img src="https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/9/5/16d00f438b83168e~tplv-t2oaga2asx-jj-mark:3024:0:0:0:q75.awebp" />

### 特点

函数式编程有如下特点：

##### 一等公民

函数是一等公民，这是函数式编程得以实现的前提。具体来说，这个特性表示函数和其他数据类型一样，处于平等地位。函数可以赋值给变量，也可以作为参数传入另一个函数，或者作为一个函数的返回值。就像前面的例子一样：

```javascript
const convert2Obj = compose(genObj("name"), capitalizeName);
```

##### 声明式编程

不难看到，函数式编程大多时候都是在描述需要做什么，而不是怎么去做，这种编程风格被称为声明式编程。因为声明式代码大多都是接近自然语言的，所以它的代码可读性很高。此外，由于关注结果而不是具体过程，声明式编程也非常方便开发人员进行分工协作。

`SQL` 语句就是典型的声明式编程，我们无需关注 `select` 语句是如何实现的，只需要知道可以通过它找到我们所需要的数据。`React` 使用的也是声明式编程，我们只需要描述 `ui`，至于状态变化之后 `ui` 如何更新，`React` 会在运行时自动处理。

##### 惰性执行

函数只在需要的时候执行，不会产生无意义的中间变量。以前面的例子来说，函数式编程跟命令式编程最大的区别就在于几乎没有中间变量，它从头到尾都在写函数，只有在最后的时间才通过调用 `convertName` 产生实际的结果。

##### 无状态和不可变数据

// https://juejin.cn/post/6844903936378273799?searchId=20240621155523135F885AF06813765E06#heading-6
// 服务端的知识，还是太欠缺了，项目部署这一块太陌生了
