'use strict';
/*
  可以保存函数字符串，或函数本体
  [
    {
      when: [ ['notEmpty'], ['max', [100]] ]
      run: [ ['int', '错误'], ['min', [10], '错误'] ]
    }
  ]
*/
function Item(parent) {
  this.parent = parent;
  this._reset();
}

Item.prototype = {
  _reset: function() {
    // 条件列表
    this.conditions = [];
    // 当前的条件
    this.current = {};
    // 构建current和conditions的联系
    this._buildNext();
  },

  _buildNext: function() {
    var current = this.current;

    if (current.run && current.run.length <= 0) {
      this.conditions.pop();
    }

    current = this.current = {
      when: [],
      run: []
    };
    this.conditions.push(current);
  },

  check: function(){
    var parent = this.parent;
    return parent.check.apply(parent, arguments);
  },

  define: function(fn) {
    var fnLen = fn.length - 1;
    var args = toArray(arguments).slice(1);
    var error = args.slice(fnLen)[0];
    this.current.run.push([fn, args.slice(0, fnLen), error]);
    return this;
  },

  // callback(val, next); -> val 当前的值，next('error');错误 或 next();成功
  custom: function(callback) {
    var INTERRUPT = '__interrupt__';

    var fn = function(val) {
      var thenable = new Thenable();
      var next = function(error) {
        if (error) {
          thenable.reject(error);
          throw INTERRUPT;
        } else {
          thenable.resolve();
        }
      };

      var ctx = getCheckerContenxt(this, val, next);
      var args = [val, next].concat(toArray(arguments).slice(1));

      try {
        callback.apply(ctx, args);
      } catch (e) {
        // 不影响正常调试
        if (e !== INTERRUPT) {
          throw e;
        }
      }

      return thenable;
    }

    var args = toArray(arguments);
    this.current.run.push([fn, args.slice(1)]);

    return this;
  },

  then: function() {
    var current = this.current;
    current.when = current.run.slice(0);
    current.run = [];
    return this;
  },

  end: function() {
    this._buildNext();
    return this;
  },

  start: function(value, callback) {
    var self = this;
    var conditions = this.conditions.slice(0);

    recurList(conditions, {
      next: function(condition, next) {
        self._startNext(value, condition, function(error) {
          if (error) {
            callback(error);
          } else {
            next();
          }
        });
      },

      callback: function() {
        callback.call(self);
      }
    });
  },

  // condition = { when: [], run: [] }
  _startNext: function(value, condition, next) {
    var self = this;
    this._run(value, condition.when.slice(0))
      .then(function() {
        self._run(value, condition.run.slice(0))
          .then(function(){
            next();
          })["catch"](next);
      })["catch"](function() {
        next();
      });
  },

  // checkers = [ ['notEmpty'], ['max', [100]] ]
  _run: function(value, checkers) {
    var self = this;
    var thenable = new Thenable();

    recurList(checkers, {
      next: function(checker, next) {
        var parser = self._parseCondition(checker, value);
        var fn = parser.fn,
            key = parser.key,
            error = parser.error || key,
            params = parser.params;
        var result = fn.apply(self, params);
        var rejectResult = { key: key, error: error };

        if (result && result.then) {
          result.then(
            next,
            function(customError){
              // 有自定义的错误，则走自己的错误
              if (customError) {
                rejectResult.error = customError;
              }
              thenable.reject(rejectResult);
            }
          );
        } else {
          if (result) {
            next();
          } else {
            thenable.reject(rejectResult);
          }
        }
      },

      callback: function() {
        thenable.resolve();
      }
    });

    return thenable;
  },

  // condition = ['min', [1], '错误']
  _parseCondition: function(condition, value) {
    var fn = condition[0];
    return {
      key: fn,
      fn: isFunction(fn) ? fn : checkers[fn],
      params: [value].concat(condition[1] || []),
      error: condition[2]
    };
  }
};

function getCheckerContenxt(parent, val, next) {
  var ctx = { ctx: parent };
  keys(checkers, function(key, fn){
    ctx[key] = function() {
      var args = toArray(arguments);
      var error = args.splice(fn.length - 1)[0];
      var result = fn.apply(parent, [val].concat(args));

      if (result) {
        if (result.then) {
          result.then(
            noop,
            function(customError) { next(customError || error); }
          );
        }
      } else if (error) {
        next(error);
      }

      return result;
    };
  });
  return ctx;
}

function combineChecker() {
  var proto = Item.prototype;
  keys(checkers, function(key, fn){
    proto[key] = addChecker(key, fn);
  });
}

function addChecker(key, fn) {
  if (!checkers[key]) {
    checkers[key] = fn;
  }

  return function() {
    var fnLen = fn.length - 1;
    var args = toArray(arguments);
    var err = args.slice(Math.min(args.length, fnLen))[0];
    this.current.run.push([key, args.slice(0, fnLen), err]);
    return this;
  };
}

combineChecker();
