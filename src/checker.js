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
