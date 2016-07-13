'use strict';
/*
  可以保存函数字符串，或函数本体
  [
    {
      when: [ ['notEmpty'], ['max', [100]] ]
      run: [ ['int', ['错误']], ['min', [10], ['错误']] ]
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
        self._startNext(value, condition, function(errors) {
          if (errors) {
            callback.apply(self, errors);
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
          .catch(function(errors){
            next(errors);
          });
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
        var fn = parser.fn, params = parser.params, errors = parser.errors;
        var result = fn.apply(self, params);

        if (result && result.then) {
          result.then(
            next, function(){ thenable.reject(errors); }
          );
        } else {
          if (result) {
            next();
          } else {
            thenable.reject(errors);
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
    return {
      fn: checkers[condition[0]],
      params: [value].concat(condition[1] || []),
      errors: condition[2]
    };
  }
};

function combineChecker() {
  var proto = Item.prototype;
  keys(checkers, function(fn, key){
    proto[key] = addChecker(key, fn);
  });
}

function addChecker(key, fn) {
  return function() {
    var args = toArray(arguments);
    var errs = args.splice(Math.min(args.length, fn.length - 1));
    this.current.run.push([key, args, errs]);
    return this;
  };
}

combineChecker();
