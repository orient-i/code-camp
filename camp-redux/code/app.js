// Redux actions
const increment = () => {
  return { type: "INCREMENT" };
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

// Redux store
const store = Redux.createStore(counter);

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
