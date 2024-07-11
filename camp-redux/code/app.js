// Redux actions
const increment = () => {
  return (dispatch) => {
    // 点击 increment 按钮之后，果然先打印了两次 thunk trigger，然后再执行的 logger middleware
    // 原因请参考 redux.md 中最后一段关于 applyMiddleware 的分析
    dispatch({ type: "INCREMENT" });
  };
};

const decrement = () => {
  return { type: "DECREMENT" };
};

// Redux reducer
const counter = (state = 0, action) => {
  switch (action.type) {
    case "INCREMENT":
      return state + 1;
    case "DECREMENT":
      return state - 1;
    default:
      return state;
  }
};

function thunk({ dispatch, getState }) {
  return (next) => (action) => {
    console.log("thunk trigger");
    if (typeof action === "function") {
      return action(dispatch, getState, undefined);
    }
    return next(action);
  };
}

// 自定义 middleware
function logger({ dispatch, getState }) {
  return (next) => (action) => {
    console.log("will dispatch", action);
    const returnValue = next(action);
    console.log("state after dispatch", getState());
    return returnValue;
  };
}

// Redux store
const store = Redux.createStore(counter, Redux.applyMiddleware(thunk, logger));

// Subscribe to Redux store changes
const subscribe = () => {
  store.unsubscribe = store.subscribe(() => {
    console.log("state change");
  });
};

const unsubscribe = () => {
  store.unsubscribe();
  console.log("cancel subscribe");
};
