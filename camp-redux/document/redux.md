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

`actionTypes.js` 文件用于定义一些 `redux` 内部使用的 `action` 类型，`randomString` 函数用于生成随机字符串，防止这些内部使用的 `action` 类型和开发者定义的 `action` 类型发生冲突。

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

##### formatProdErrorMessage

`formatProdErrorMessage.js` 文件用于格式化在生产环节中捕获到的错误消息。

```javascript
function formatProdErrorMessage(code) {
  return (
    `Minified Redux error #${code}; visit https://redux.js.org/Errors?code=${code} for the full message or ` +
    "use the non-minified dev environment for full errors. "
  );
}

export default formatProdErrorMessage;
```

##### isPlainObject

`isPlainObject.js` 文件的作用就像它的文件名一样，它用于判定参数是否是一个“纯对象”。

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

“纯对象”指的是直接继承自 `Object.prototype` 的对象（或者原型为 `null` 的对象），可以通过字面量声明、`new Object()`、`Object.create(null)` 这三种方式创建纯对象。

> 注意，4.2.1 的 isPlainObject 不会将 Object.create(null) 创建的对象视作纯对象。这个问题在 5.0.1 被修复了，详情请看 https://github.com/reduxjs/redux/pull/4633

##### kindOf

`kindOf.js` 文件用于获取参数的类型。在非生产模式下，参数类型会划分的更细一些，比如 `Promise`，`WeakMap`，`WeakSet`，`Error` 等等。

##### symbol-observable

`symbol-observale.js` 文件是对 `Symbol.observable` 的 `polyfill`。

```javascript
export default (() =>
  (typeof Symbol === "function" && Symbol.observable) || "@@observable")();
```

##### warning

`warning.js` 文件会先将错误的详细信息打印出来，然后再将错误抛出。

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

#### core

接下来逐个分析核心文件代码。

##### index

`index.js` 文件是个纯导出文件，用于将其他文件的内容向外导出。

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

##### compose

`compose.js` 文件用于实现函数组合。

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

##### bindActionCreators

`action creator` 是指返回值为 `action` 的函数，例如：

```javascript
function add(payload) {
  return { type: "add", payload };
}

class ComponentA extends React.Component {
  handleClick() {
    const { add } = this.props;
  }

  render() {
    return <div onClick={handleClick}>increment</div>;
  }
}

const mapDIspatchToProps = (dispatch) => ({
  add: () => dispatch(add);
});

// prettier ignore
export default connect(undefined, mapDispatchToProps, undefined, undefined)(ComponentA);
```

`bindActionCreators` 会将 `dispatch` 和 `action creator` 给 `bind` (绑定)起来，自动执行 `dispatch` 操作，不再需要开发者手动执行 `dispatch` 操作。

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

在类组件场景下，使用 `connect` 将 `action creator` 绑定到组件上时，可以将 `mapDispatchToProps` 的值设置成一个简写对象，`react-redux` 会自动执行 `bindActionCreators` 将 `dispatch` 注入到 `action creator` 中。详情请看：https://cn.react-redux.js.org/api/connect/#%E5%AF%B9%E8%B1%A1%E7%AE%80%E5%86%99%E5%BD%A2%E5%BC%8F

##### combineReducers

`reducer` 是一个纯函数，它接受之前的 `state` 和一个 `action`，并返回一个新的 `state`。而 `redux` 之所以把它被叫做 `reducer`，是因为它和传入 `Array.prototype.reduce` 里的回调函数的类型一样。

`reducers` 是一个 `value` 是 `reducer` 的对象，`combineReducers` 文件会将 `reducers` 里的所有 `reducer` 合并成一个 `reducer`。

```javascript
export default function combineReducers(reducers) {
  const reducerKeys = Object.keys(reducers);
  const finalReducers = {};
  // 检查 reducers 的 value 是否合法，如果合法，则添加到 finalReducers 中
  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i];

    // value 不能是 undefined
    if (process.env.NODE_ENV !== "production") {
      if (typeof reducers[key] === "undefined") {
        warning(`No reducer provided for key "${key}"`);
      }
    }

    // 判定 reducer 是否是一个函数
    if (typeof reducers[key] === "function") {
      finalReducers[key] = reducers[key];
    }
  }
  const finalReducerKeys = Object.keys(finalReducers);

  // This is used to make sure we don't warn about the same
  // keys multiple times.
  let unexpectedKeyCache;
  if (process.env.NODE_ENV !== "production") {
    unexpectedKeyCache = {};
  }

  let shapeAssertionError;
  try {
    // 使用内置的 INIT 和 PROBE_UNKNOWN_ACTION 类型触发所有 reducer，以判断 reducer 在无法识别 action 时是否有默认处理。
    // 判断默认处理的返回值是否为 undefined。如果是，则该 reducer 非法。
    assertReducerShape(finalReducers);
  } catch (e) {
    shapeAssertionError = e;
  }

  return function combination(state = {}, action) {
    if (shapeAssertionError) {
      // 如果前面找到了非法的 reducer，直接抛出异常，终止流程
      throw shapeAssertionError;
    }

    // 这里调用同文件里的 getUnexpectedStateShapeWarningMessage 函数对参数做了多重校验：
    // 1. 判断 finalReducers 是否有效。如果是个空对象，没有任何 key-value，报错。
    // 2. 判断 state 是否是一个纯对象。如果不是，报错。
    // 3. 判断 state 的 key 是否都存在于 finalReducers 中。如果没有，报错。

    // other code ...

    let hasChanged = false;
    const nextState = {};
    for (let i = 0; i < finalReducerKeys.length; i++) {
      const key = finalReducerKeys[i];
      const reducer = finalReducers[key];
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);
      // 执行开发者自定义的 action，如果 reducer 返回了 undefined，报错。
      if (typeof nextStateForKey === "undefined") {
        const actionType = action && action.type;
        throw new Error(
          `When called with an action of type ${
            actionType ? `"${String(actionType)}"` : "(unknown type)"
          }, the slice reducer for key "${key}" returned undefined. ` +
            `To ignore an action, you must explicitly return the previous state. ` +
            `If you want this reducer to hold no value, you can return null instead of undefined.`
        );
      }
      nextState[key] = nextStateForKey;
      // 对比执行 action 前后的值，判断 state 是否发生变化
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }
    hasChanged =
      hasChanged || finalReducerKeys.length !== Object.keys(state).length;
    return hasChanged ? nextState : state;
  };
}
```

##### createStore

`store` 是用来维持应用整个 `state` 的一个对象，它拥有四个方法：

1. `getState()`
2. `dispatch(action)`
3. `subscribe(listener)`
4. `replaceReducer(nextReducer)`

其中的第二点是改变 `store`内 `state` 的唯一途径。

`createStore` 就是用于创建一个这样的 `store` 对象，它的内容较多，下面进行逐步分析。

首先，是对参数的前置校验：

```javascript
export function createStore(reducer, preloadedState, enhancer) {}
```
