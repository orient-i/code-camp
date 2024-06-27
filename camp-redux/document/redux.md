### 前言

`redux` 自 5.0.0 版本开始，实现方案从 `js` 改成了 `ts`，源码中多出了很多类型定义。但相比 4.2.1，功能变化不大，为了更方便地阅读和理解代码，此次源码阅读依赖的版本是 4.2.1。

### 目录

下面是项目的 src 目录结构：

```
src
  ├── applyMiddleware.js
  ├── bindActionCreators.js
  ├── combineReducers.js
  ├── compose.js
  ├── createStore.js
  ├── index.js
  └── utils
      ├── actionTypes.js
      ├── formatProdErrorMessage.js
      ├── isPlainObject.js
      ├── kindOf.js
      ├── symbol-observable.js
      └── warning.js
```

可以看到，`redux` 的项目文件还是蛮少的。

#### utils

避免后续分析核心代码中断，先从通用工具方法文件夹 `utils` 开始分析

##### actionTypes.js

```javascript
const randomString = () =>
  Math.random().toString(36).substring(7).split("").join(".");

const ActionTypes = {
  INIT: `@@redux/INIT${randomString()}`,
  REPLACE: `@@redux/REPLACE${randomString()}`,
  PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`,
};

export default ActionTypes;
```

`actionTypes.js` 文件用于定义一些 `redux` 内部使用的 `action` 类型，`randomString` 函数用于生成随机字符串，防止这些内部使用的 `action` 类型和开发者定义的 `action` 类型发生冲突。

##### formatProdErrorMessage

```javascript
function formatProdErrorMessage(code) {
  return (
    `Minified Redux error #${code}; visit https://redux.js.org/Errors?code=${code} for the full message or ` +
    "use the non-minified dev environment for full errors. "
  );
}

export default formatProdErrorMessage;
```

`formatProdErrorMessage.js` 文件用于格式化在生产环节中捕获到的错误消息。

##### isPlainObject

```javascript
export default function isPlainObject(obj) {
  if (typeof obj !== "object" || obj === null) return false;

  let proto = obj;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }

  return Object.getPrototypeOf(obj) === proto;
}
```

`isPlainObject.js` 文件的作用就像它的文件名一样，它用于判定参数是否是一个“纯对象”。

“纯对象”指的是直接继承自 `Object.prototype` 的对象（或者原型为 `null` 的对象），可以通过字面量声明、`new Object()`、`Object.create(null)` 这三种方式创建纯对象。

> 注意，4.2.1 的 isPlainObject 不会将 Object.create(null) 创建的对象视作纯对象。这个问题在 5.0.1 被修复了，详情请看 https://github.com/reduxjs/redux/pull/4633

##### kindOf

`kindOf.js` 文件用于获取参数的类型。在非生产模式下，参数类型会划分的更细一些，比如 `Promise`，`WeakMap`，`WeakSet`，`Error` 等等。

##### symbol-observable

```javascript
export default (() =>
  (typeof Symbol === "function" && Symbol.observable) || "@@observable")();
```

`symbol-observale.js` 文件是对 `Symbol.observable` 的 `polyfill`。

##### warning

```javascript
export default function warning(message) {
  if (typeof console !== "undefined" && typeof console.error === "function") {
    console.error(message);
  }
  try {
    throw new Error(message);
  } catch (e) {}
}
```

`warning.js` 文件会先将错误的详细信息打印出来，然后再将错误抛出。

#### core

接下来逐个分析核心文件代码。

##### index

```javascript
import { createStore, legacy_createStore } from "./createStore";
import combineReducers from "./combineReducers";
import bindActionCreators from "./bindActionCreators";
import applyMiddleware from "./applyMiddleware";
import compose from "./compose";
import __DO_NOT_USE__ActionTypes from "./utils/actionTypes";

export {
  createStore,
  legacy_createStore,
  combineReducers,
  bindActionCreators,
  applyMiddleware,
  compose,
  __DO_NOT_USE__ActionTypes,
};
```

`index.js` 文件是个纯导出文件，用于将其他文件的内容向外导出。

##### compose

```javascript
export default function compose(...funcs) {
  if (funcs.length === 0) {
    return (arg) => arg;
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  // prettier-ignore
  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}
```

`compose.js` 文件用于实现函数组合。

##### bindActionCreators

`actionCreator` 是指返回值为 `action` 的函数，例如：

```javascript
function add(payload) {
  return { type: "add", payload };
}
```

对于一个 `actionCreator`，代码中的常见用法是 `dispatch(add(payload))`。`bindActionCreators` 则会将 `dispatch` 和 `actionCreator` 给 `bind` (绑定)起来。

```javascript
function bindActionCreator(actionCreator, dispatch) {
  return function () {
    return dispatch(actionCreator.apply(this, arguments));
  };
}

export default function bindActionCreators(actionCreators, dispatch) {
  if (typeof actionCreators === "function") {
    return bindActionCreator(actionCreators, dispatch);
  }

  if (typeof actionCreators !== "object" || actionCreators === null) {
    throw new Error(
      `bindActionCreators expected an object or a function, but instead received: '${kindOf(
        actionCreators
      )}'. ` +
        `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
    );
  }

  const boundActionCreators = {};
  for (const key in actionCreators) {
    const actionCreator = actionCreators[key];
    if (typeof actionCreator === "function") {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch);
    }
  }
  return boundActionCreators;
}
```
