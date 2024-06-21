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

##### 命令式编程

命令式编程是一种关注实现过程的编程范式：

1. 定义一个临时变量 newArr。
2. 遍历数组。
3. 在遍历的过程中，将名字的首位取出来大写，然后拼接剩余的部分。
4. .......
5. 最后得到结果。

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
