self["webpackHotUpdatewebpack_dev_server"](
  "main",
  {
    "./src/hello.js": (
      __unused_webpack_module,
      __webpack_exports__,
      __webpack_require__
    ) => {
      __webpack_require__.r(__webpack_exports__);
      __webpack_require__.d(__webpack_exports__, {
        default: () => __WEBPACK_DEFAULT_EXPORT__,
      });
      const hello = () => {
        return "Hello world!. Nice to meet you";
      };
      const __WEBPACK_DEFAULT_EXPORT__ = hello;
    },
  },
  function (__webpack_require__) {
    (() => {
      __webpack_require__.h = () => "6f95202565c4c5f03e0e";
    })();
  }
);

function internalApply(options) {
  options = options || {};

  applyInvalidatedModules();

  var results = currentUpdateApplyHandlers.map(function (handler) {
    return handler(options);
  });
  currentUpdateApplyHandlers = undefined;

  var errors = results
    .map(function (r) {
      return r.error;
    })
    .filter(Boolean);

  if (errors.length > 0) {
    return setStatus("abort").then(function () {
      throw errors[0];
    });
  }

  // Now in "dispose" phase
  var disposePromise = setStatus("dispose");

  results.forEach(function (result) {
    if (result.dispose) result.dispose();
  });

  // Now in "apply" phase
  var applyPromise = setStatus("apply");

  var error;
  var reportError = function (err) {
    if (!error) error = err;
  };

  var outdatedModules = [];
  results.forEach(function (result) {
    if (result.apply) {
      var modules = result.apply(reportError);
      if (modules) {
        for (var i = 0; i < modules.length; i++) {
          outdatedModules.push(modules[i]);
        }
      }
    }
  });

  return Promise.all([disposePromise, applyPromise]).then(function () {
    // handle errors in accept handlers and self accepted module load
    if (error) {
      return setStatus("fail").then(function () {
        throw error;
      });
    }

    if (queuedInvalidatedModules) {
      return internalApply(options).then(function (list) {
        outdatedModules.forEach(function (moduleId) {
          if (list.indexOf(moduleId) < 0) list.push(moduleId);
        });
        return list;
      });
    }

    return setStatus("idle").then(function () {
      return outdatedModules;
    });
  });
}

function applyHandler(options) {
  // ...
  function getAffectedModuleEffects(updateModuleId) {
    // ...
    while (queue.length > 0) {
      if (!module || (module.hot._selfAccepted && !module.hot._selfInvalidated))
        continue;
      if (module.hot._selfDeclined) {
        // ...
      }
      if (module.hot._main) {
        return {
          type: "unaccepted",
          chain: chain,
          moduleId: moduleId,
        };
      }
      for (var i = 0; i < module.parents.length; i++) {
        // ...
      }
    }
  }
  // at begin all updates modules are outdated
  // the "outdated" status can propagate to parents if they don't accept the children
  var outdatedDependencies = {};
  var outdatedModules = [];
  var appliedUpdate = {};

  for (var moduleId in currentUpdate) {
    if (__webpack_require__.o(currentUpdate, moduleId)) {
      var newModuleFactory = currentUpdate[moduleId];
      var result;
      if (newModuleFactory) {
        result = getAffectedModuleEffects(moduleId);
      } else {
        result = {
          type: "disposed",
          moduleId: moduleId,
        };
      }
      var abortError = false;
      var doApply = false;
      var doDispose = false;
      var chainInfo = "";
      if (result.chain) {
        chainInfo = "\nUpdate propagation: " + result.chain.join(" -> ");
      }
      switch (result.type) {
        case "self-declined":
          // ...
          break;
        case "declined":
          // ...
          break;
        case "unaccepted":
          if (options.onUnaccepted) options.onUnaccepted(result);
          if (!options.ignoreUnaccepted)
            abortError = new Error(
              "Aborted because " + moduleId + " is not accepted" + chainInfo
            );
          break;
        case "accepted":
          if (options.onAccepted) options.onAccepted(result);
          doApply = true;
          break;
        case "disposed":
          if (options.onDisposed) options.onDisposed(result);
          doDispose = true;
          break;
        default:
          throw new Error("Unexception type " + result.type);
      }
      if (abortError) {
        return {
          error: abortError,
        };
      }
      if (doApply) {
        // 记录待处理数据
      }
      if (doDispose) {
        // 记录待处理数据
      }
    }
  }

  return {
    dispose: function () {
      currentUpdateRemovedChunks.forEach(function (chunkId) {
        delete installedChunks[chunkId];
      });
      currentUpdateRemovedChunks = undefined;
      delete __webpack_require__.c[moduleId];
      delete outdatedDependencies[moduleId];
    },
    apply: function (reportError) {
      // insert new code
      for (var updateModuleId in appliedUpdate) {
        if (__webpack_require__.o(appliedUpdate, updateModuleId)) {
          __webpack_require__.m[updateModuleId] = appliedUpdate[updateModuleId];
        }
      }

      // run new runtime modules
      for (var i = 0; i < currentUpdateRuntime.length; i++) {
        currentUpdateRuntime[i](__webpack_require__);
      }

      // call accept handlers
      for (var outdatedModuleId in outdatedDependencies) {
        var module = __webpack_require__.c[outdatedModuleId];
        for (var j = 0; j < moduleOutdatedDependencies.length; j++) {
          var dependency = moduleOutdatedDependencies[j];
          var acceptCallback = module.hot._acceptedDependencies[dependency];
          callbacks.push(acceptCallback);
        }
        for (var k = 0; k < callbacks.length; k++) {
          callbacks[k].call(null, moduleOutdatedDependencies);
        }
      }

      // Load self accepted modules
      for (var o = 0; o < outdatedSelfAcceptedModules.length; o++) {
        var item = outdatedSelfAcceptedModules[o];
        var moduleId = item.module;
        item.require(moduleId);
      }

      return outdatedModules;
    },
  };
}
