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
// 
// console.log(
//   compileToAttr({data: {code: 1}}, 'data.code')[0].value
// );
