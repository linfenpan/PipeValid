'use strict';

var checkers = {
  max: function(val, len){
    val = "" + val;
    return val && val.length <= len;
  },
  min: function(val, len){
    val = "" + val;
    return val && val.length >= len;
  },
  notEmpty: function(val){
    return val != null && !/^\s*$/g.test(val);
  },
  url: function(val){
    return /^(https?:|ftp:)?\/\/([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(val);
  },
  email: function(val){
    return /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/.test(val);
  },
  number: function(val){
    return !isNaN(Number(val));
  },
  int: function(val){
    return /^-?\d+$/.test(val);
  },
  // 下面几个，针对数字的对比
  gt: function(val, compareVal) {
    return Number(val) > compareVal;
  },
  gte: function(val, compareVal) {
    return Number(val) >= compareVal;
  },
  lt: function(val, compareVal) {
    return Number(val) < compareVal;
  },
  lte: function(val, compareVal) {
    return Number(val) <= compareVal;
  }
};
