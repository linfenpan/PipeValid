/**
  该有什么功能呢?
  var valid = new PipeValid();
  定义合适检查该属性:
  1. 有定义checker定义，并且存在该属性的
  2. 强制指定验证的

  √ # 场景1:
  valid.check('age')
    .notEmpty('年龄不能为空')
    .then()
    .max(100, '年龄最大100')
    .min(10, '年龄最小10')
    .end()
    .number('必须填写数字');

  var data = { age: 10 };
  valid.start(data);

  √ # 场景2:
  valid.asyncStart(data); -> 返回一个 promise/a 规范的对象
  --> 更改为 valid.start 必定返回一个 thenable 对象，如果 check 的链条中，有异步，则是异步的，没有，则同步

  √ # 场景3:
  var isAllError = true;
  valid.start(data, isAllError);
  --> 返回的 thenable 对象的 error 属性，将会是个数组

  √ # 场景4:
  valid.start(data, ['age', 'name']); -> 仅验证 age 和 name 两个属性

  × # 场景5:
  valid.asyncStart(['age', 'name']); -> 仅验证 age 和 name 两个属性
  -> 更改为，valid.start() 绝对返回一个thenable对象

  √ # 场景6:
  valid.define('isBear', function(value){
    return value === 'bear';
  });
  valid.check('name').isBear();

  × # 场景7:
  valid.define(function isBear(value){
    return value === 'bear';
  });
  valid.check('name').isBear();
  --> 考虑到代码压缩，这个功能放弃

  √ # 场景8:
  valid.check('data.name').notEmpty('xxx');
  属性对象内的某个属性，不能是空

  √ # 场景9:
  valid.check('list[1].name').notEmpty('xxx');
  列表属性中的子属性，不能是空

  √ # 场景10:
  valid.check('list[].name').notEmpty('xxx');
  列表属性中，所有某个子属性，都不能为空

  √ # 场景11:
  添加简单的验证:
  valid.check({
    name: [
      ['notEmpty', '不能为空'],
      ['min', 3, '最少3位']
    ],
    age: ['int', '必须是整数']
  });

  √ # 场景12:
  中途插入其他验证
  valid.check('name')
    .define(function(val, 参数1){
      return val === '1002';
    }, 参数1, '这就是错误啊，怎么样?');

  # 场景13:
  valid.check('name')
    .custom(function(val, next) {
      // min 和 max，如果返回 false，都将抛出错误
      if (min(3, '最小3位哦') && max(10, '最大10位')) {
        if (val === 'bear') {
          // pass
          next();
        } else {
          // error
          next('名字必须是bear!!');
        }
      }
    });
*/
