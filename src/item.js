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

function Item() {
  // 条件列表
  this.conditions = [];
  // 当前的条件
  this.current = {};

  this._buildNext();
}

Item.prototype = {
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

  define: function(fn) {
    var args = toArray(arguments).slice(1);
    var error = args.splice(fn.length - 1)[0];
    this.current.run.push([fn, args, error]);
    return this;
  },

  custom: function(fn) {
    // TODO 本期终极设想函数..
    return this;
  },

  then: function() {
    var current = this.current;
    current.when = current.run.splice(0);
    return this;
  },

  end: function() {
    this._buildNext();
    return this;
  },

  start: function(value, callback) {
    // [
    //   {
    //     when: [ ['notEmpty'], ['max', [100]] ]
    //     run: [ ['int', ['错误']], ['min', [10], ['错误']] ]
    //   }
    // ]
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

  _startNext: function(value, condition, next) {
    var self = this;
    this._run(value, condition.when.slice(0))
      .then(function() {
        self._run(value, condition.run.slice(0))
          .then(function(){
            next();
          })
          .catch(next);
      })
      .catch(function() {
        next();
      });
  },

  // [ ['notEmpty'], ['max', [100]] ]
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
            next, function(){ thenable.reject(rejectResult); }
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

function combineChecker() {
  var proto = Item.prototype;
  keys(checkers, function(key, fn){
    proto[key] = addChecker(key, fn);
  });
}

function addChecker(key, fn) {
  return function() {
    var args = toArray(arguments);
    var err = args.splice(Math.min(args.length, fn.length - 1))[0];
    this.current.run.push([key, args, err]);
    return this;
  };
}

combineChecker();
