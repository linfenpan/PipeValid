'use strict';
/*
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

  start: function(value, next) {
    // [
    //   {
    //     when: [ ['notEmpty'], ['max', [100]] ]
    //     run: [ ['int', ['错误']], ['min', [10], ['错误']] ]
    //   }
    // ]
    var self = this;
    var conditions = this.conditions.slice(0);
    this._startAll(value, conditions, function(errors) {
      next.apply(self, errors);
    });
  },

  _startAll: function(value, conditions, next) {
    var self = this;
    if (conditions && conditions.length > 0) {
      var condition = conditions.shift();
      this._startNext(value, condition, function(errors) {
        if (errors) {
          next(errors);
        } else {
          self._startAll(value, conditions, next);
        }
      });
    } else {
      next();
    }
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
  _run: function(value, checkers, thenable) {
    var self = this;
    thenable = thenable || new Thenable();

    if (checkers && checkers.length > 0) {
      var checker = checkers.shift();
      var parser = self._parseCondition(checker, value);
      var fn = parser.fn, params = parser.params, errors = parser.errors;
      var result = fn.apply(self, params);

      if (result && result.then) {
        result.then(
          function(){ self._run(value, checkers, thenable); },
          function(){ thenable.reject(errors); }
        );
      } else {
        if (result) {
          self._run(value, checkers, thenable);
        } else {
          thenable.reject(errors);
        }
      }
    } else {
      thenable.resolve();
    }
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
