'ust strict';

function Thenable() {
  this._records = [];
  this._param = null;
  this._state = 'pending';
}

Thenable.prototype = {
  _exe: function(param) {
    var state = this._state;
    var list = this._records;
    var item;
    while (item = list.shift()) {
      if (state === 'done') {
        if (item.done) {
          param = item.done.call(this, param);
        }
      } else {
        if (item.fail) {
          param = item.fail.call(this, param);
        }
      }
      this._pipeToNextThen(param);
    }
    return this;
  },

  _pipeToNextThen: function(then) {
    if (then instanceof Thenable) {
      then._records = this._records.splice(0);
      return then;
    }
    this._param = then;
    return this;
  },

  resolve: function(param) {
    if (this._state === 'pending') {
      this._state = 'done';
      this._param = param;
      return this._exe(param);
    }
    return this;
  },

  reject: function(param) {
    if (this._state === 'pending') {
      this._state = 'fail';
      this._param = param;
      return this._exe(param);
    }
    return this;
  },

  then: function(resolve, reject) {
    this._records.push({ done: resolve, fail: reject });
    if (this._state !== 'pending') {
      return this._exe(this._param);
    }
    return this;
  },

  catch: function(fn) {
    return this.then(null, fn);
  }
};
