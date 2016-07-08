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
    this.buildNext();
    return this;
  },

  start: function(checkAll, next) {
    return this;
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
