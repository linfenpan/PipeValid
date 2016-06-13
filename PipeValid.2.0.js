/**
  该有什么功能呢?
  var valid = new PipeValid();

  # 场景1:
  valid.check('age')
    .notEmpty('年龄不能为空')
    .then()
    .max(100, '年龄最大100')
    .min(10, '年龄最小10')
    .end()
    .number('必须填写数字');

  var data = { age: 10 };
  valid.start(data);

  # 场景2:
  valid.asyncStart(data); -> 返回一个 promise/a 规范的对象

  # 场景3:
  var isAllError = true;
  valid.start(data, isAllError);

  # 场景4:
  valid.start(['age', 'name']); -> 仅验证 age 和 name 两个属性

  # 场景5:
  valid.asyncStart(['age', 'name']); -> 仅验证 age 和 name 两个属性

  # 场景6:
  valid.define('isBear', function(value){
    return value === 'bear';
  });
  valid.check('name').isBear();

  # 场景7:
  valid.define(function isBear(value){
    return value === 'bear';
  });
  valid.check('name').isBear();
*/
