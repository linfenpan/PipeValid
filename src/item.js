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
    var conditions = this.conditions;

    return this;
  },

  _next: function() {

  },

  _parseCondition: function(condition, value) {
    return {
      fn: this[condition[0]],
      params: [value].concat(condition[1] || []),
      errors: condition[2]
    };
  },

  _buildRunableThen: function(condition, value) {
    var self = this;
    var parse = self._parseCondition(condition, value);
    var thenable = new Thenable();

    thenable.run = function() {
      var fn = parse.fn, params = parse.params, errors = parse.errors;
      var result = fn.apply(self, params);
      if (result.then) {
        result.then(
          function resolve() {
            thenable.resolve();
          },
          function reject() {
            thenable.reject(errors);
          }
        );
      } else {
        if (result) {
          thenable.resolve(errors);
        } else {
          thenable.reject(errors);
        }
      }
    };
    return thenable;
  },

  _run: function(list, value) {
    var self = this;
    var thenables = [];
    forEach(list, function(condition){
      var thenable = self._buildRunableThen(condition, value);
      thenable.run();
      thenables.push(thenables);
    });
    return thenables;
  },

  _when: function(whens, value) {
    return Thenable.all(
      this._run(whens, value)
    );
  },
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
