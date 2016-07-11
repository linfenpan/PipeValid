'ust strict';

function Thenable() {
  this._args = [];
  this._records = [];
  this._state = 'pending';
}

Thenable.prototype = {
  _exe: function() {
    state = this._state;
    var list = this._records;
    var item;
    while (item = list.shift()) {
      if (state === 'done') {
        item.done && item.done.apply(this, this._args);
      } else {
        item.fail && item.fail.apply(this, this._args);
      }
    }
    return this;
  },
  resolve: function() {
    if (this._state === 'pending') {
      this._state = 'done';
      this._args = toArray(arguments);
      return this._exe();
    }
    return this;
  },
  reject: function() {
    if (this._state === 'pending') {
      this._state = 'fail';
      this._args = toArray(arguments);
      return this._exe();
    }
    return this;
  },
  then: function(resolve, reject) {
    this._records.push({ done: resolve, fail: reject });
    if (this._state !== 'pending') {
      return this._exe();
    }
    return this;
  },
};

// 不记录结果
Thenable.all = function all(list) {
  var thenable = new Thenable();
  function next(list) {
    if (list && list.length > 0) {
      var now = list.shift();
      now.then(
        function resolve() {
          next(list);
        },
        function reject(error){
          thenable.reject(error);
        }
      );
    } else {
      thenable.resolve();
    }
  }
  next(list);
  return thenable;
}
