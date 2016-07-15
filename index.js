/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	/*! pipe-valid-2.0.0 by da宗熊 ISC https://github.com/linfenpan/PipeValid#readme*/
	'use strict';
	function noop() {
	  // nothing
	}

	function type(obj) {
	  return Object.prototype.toString
	    .call(obj)
	    .split(' ')[1]
	    .slice(0, -1)
	    .toLowerCase();
	}

	function isFunction(fn) {
	  return type(fn) === 'function';
	}

	function isObject(obj) {
	  return type(obj) === 'object';
	}

	function isArray(arr) {
	  return type(arr) === 'array';
	}

	function isEmptyObject(obj) {
	  for (var i in obj) {
	    if (obj.hasOwnProperty(i)) {
	      return false;
	    }
	  }
	  return true;
	}

	function trim(str) {
	  return str.trim
	    ? str.trim()
	    : str.replace(/^\s*|\s*$/, '');
	}

	function toArray(obj) {
	  return [].slice.call(obj, 0);
	}

	function extend(obj1, obj2) {
	  keys(obj2, function(key, value) {
	    obj1[key] = value;
	  });
	}

	function keys(obj, callback) {
	  for (var key in obj) {
	    if (obj.hasOwnProperty(key)) {
	      callback.call(obj, key, obj[key]);
	    }
	  }
	}

	function forEach(arr, callback) {
	  for (var i = 0, max = arr.length; i < max; i++) {
	    callback.call(arr, arr[i], i);
	  }
	}

	function recurList(list, options) {
	  options = options || {};
	  var next = options.next || noop;
	  var callback = options.callback || noop;

	  if (list && list.length > 0) {
	    var item = list.shift();
	    next(item, function again() {
	      recurList(list, options);
	    });
	  } else {
	    callback();
	  }
	}

	// compileToAttr({ name: 123 }, 'name') --> [ {value: 123} ]
	// compileToAttr([{ name: 123 }], '[].name'); --> [ {value: 123} ]
	// compileToAttr([{ name: 123 }], '[0].name'); --> [ {value: 123} ]
	// compileToAttr([{ name: 123 }], '[].age'); --> [ {nonexist: true} ]
	var COMPILE_TO_ATTR_REG = /([^.\[\]]+)|(\[\d*\]|\.)/g;
	var COMPILE_TO_ATTR_IS_LIST = /^\[(\d*)\]$/;
	function compileToAttr(data, str, _compileList) {
	  var strList = _compileList || str.match(COMPILE_TO_ATTR_REG);
	  var isAttrExist = true;
	  var sentence;

	  var next = function(key) {
	    if (key in data) {
	      data = data[key];
	    } else {
	      isAttrExist = false;
	    }
	  };

	  while(strList.length) {
	    sentence = trim(strList.shift());
	    if (!sentence) {
	      continue;
	    }

	    if (COMPILE_TO_ATTR_IS_LIST.test(sentence)) {
	      // 列表
	      var matches = sentence.match(COMPILE_TO_ATTR_IS_LIST);
	      var listIndex = matches[1];

	      if (listIndex) {
	        next(listIndex);
	      } else {
	        // 展开列表，继续寻找
	        if (isArray(data)) {
	          var _list = [];

	          forEach(data, function(_data) {
	            var _result = compileToAttr(_data, null, strList.slice(0));
	            _list.push.apply(_list, _result);
	          });

	          return _list;
	        } else {
	          isAttrExist = false;
	        }
	      }
	    } else {
	      // 往下寻找
	      sentence !== '.' && next(sentence);
	    }

	    if (!isAttrExist) {
	      break;
	    }
	  }

	  return isAttrExist ? [{value: data}] : [{ nonexist: true }];
	}

	'ust strict';

	var PENDING = 'pending';
	var DONE = 'done';
	var FAIL = 'fail';

	function Thenable() {
	  this._records = [];
	  this._param = null;
	  this._state = PENDING;
	}

	Thenable.prototype = {
	  _exe: function(param) {
	    var state = this._state;
	    var list = this._records;
	    var item;
	    while (item = list.shift()) {
	      if (state === DONE) {
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

	  _changeState: function(state, param) {
	    if (this._state === PENDING) {
	      this._state = state;
	      this._param = param;
	      return this._exe(param);
	    }
	    return this;
	  },

	  resolve: function(param) {
	    return this._changeState(DONE, param);
	  },

	  reject: function(param) {
	    return this._changeState(FAIL, param);
	  },

	  then: function(resolve, reject) {
	    this._records.push({ done: resolve, fail: reject });
	    if (this._state !== PENDING) {
	      return this._exe(this._param);
	    }
	    return this;
	  },

	  always: function(fn) {
	    return this.then(fn, fn);
	  },

	  "catch": function(fn) {
	    return this.then(null, fn);
	  }
	};

	'use strict';

	var checkers = {
	  // max, min, empty, email, url, phone, number, int, float
	  max: function(val, len){
	    val = "" + val;
	    return val && val.length <= len;
	  },
	  min: function(val, len){
	    val = "" + val;
	    return val && val.length >= len;
	  },
	  notEmpty: function(val){
	    return val && !/^\s*$/g.test(val);
	  },
	  url: function(val){
	    return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(val);
	  },
	  email: function(val){
	    return /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/.test(val);
	  },
	  number: function(val){
	    return !isNaN(Number(val));
	  },
	  int: function(val){
	    return /^\d+$/.test(val);
	  }
	};

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

	'use strict';
	function PipeValid() {
	  this.validers = {};
	}

	PipeValid.prototype = {
	  define: function(key, fn) {
	    PipeValid.define(key, fn);
	    return this;
	  },

	  // pipe.check('age')
	  // pipe.check('data.total');
	  check: function(key) {
	    if (isObject(key)) {
	      return this.rule(key);
	    } else {
	      var valider = this.validers[key]
	        || (this.validers[key] = new Item(this));
	      valider.end();
	      return valider;
	    }
	  },

	  rule: function(obj) {
	    var self = this;
	    // args = ['min', 2, '最少两位']
	    var addToChecker = function(checker, args) {
	      checker[args[0]].apply(checker, args.slice(1));
	    };

	    keys(obj, function(key, arr) {
	      if (isArray(arr)) {
	        var checker = self.check(key);
	        checker._reset();

	        if (isArray(arr[0])) {
	          forEach(arr, function(args) {
	            addToChecker(checker, args);
	          });
	        } else {
	          addToChecker(checker, arr);
	        }
	      }
	    });

	    return this;
	  },

	  /**
	    * 启动验证
	    * @param {Object} data，需要验证的数据
	    * @param {Array?} restrict，指定哪些数据需要验证
	    * @param {Boolean} isCheckAll，是否需要验证全部数据
	    * @return {thenable object} 返回一个带有 then 回调的对象，如果验证内容，没有涉及异步，此对象的回调，将同步执行
	   */
	  start: function(data, restrict, isCheckAll) {
	    data = data || {};

	    if (!isArray(restrict)) {
	      isCheckAll = restrict;
	      restrict = [];
	    }

	    var thenable = new Thenable();
	    var validList = this._obtainValidList(data, restrict);

	    this._checkAll(validList, function callback(error) {
	      thenable.pass = !error;
	      if (error) {
	        if (isCheckAll) {
	          thenable.error = error;
	        } else {
	          extend(thenable, error);
	        }
	        thenable.reject(error);
	      } else {
	        thenable.resolve();
	      }
	    }, isCheckAll);

	    return thenable;
	  },

	  _checkAll: function(validList, endFn, isCheckAll) {
	    var self = this;
	    var errorList = [];

	    recurList(validList, {
	      next: function(item, next) {
	        var key = item.key;
	        var value = item.value;
	        var index = item.index;
	        var valider = self.validers[key];

	        valider.start(value, function callback(error) {
	          if (error) {
	            error.index = index;
	            if (isCheckAll) {
	              errorList.push(error);
	              next();
	            } else {
	              endFn.call(self, error);
	            }
	          } else {
	            next();
	          }
	        });
	      },

	      callback: function() {
	        endFn.call(self, errorList.length > 0 ? errorList : false);
	      }
	    });
	  },

	  _obtainValidList: function(data, restrict) {
	    var self = this;
	    var validers = this.validers;
	    var validList = [];
	    var addToList = function(list) {
	      validList.push.apply(validList, list);
	    };

	    if (restrict.length > 0) {
	      forEach(restrict, function(key) {
	        if (validers[key]) {
	          addToList(self._explainAttrToList(data, key, false));
	        }
	      });
	    } else {
	      keys(validers, function(key, val) {
	        addToList(self._explainAttrToList(data, key, true));
	      });
	    }

	    return validList;
	  },

	  _explainAttrToList: function(data, key, ignorEmpty) {
	    var list = [];
	    forEach(compileToAttr(data, key), function(item, index) {
	      var itemAdded = { key: key, value: item.value, index: index };
	      if (item.nonexist) {
	        if (!ignorEmpty) {
	          list.push(itemAdded);
	        }
	      } else {
	        list.push(itemAdded);
	      }
	    });
	    return list;
	  }
	};

	/**
	  * 自定义一个验证函数
	  * @param {String} name 验证函数名字
	  * @param {Function} validFn 验证函数
	 */
	PipeValid.define = function(name, validFn) {
	  Item.prototype[name] = addChecker(name, validFn);
	};

	module.exports = PipeValid;


/***/ }
/******/ ]);
