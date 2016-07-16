# PipeValid.js —— 数据验证

最新版本：2.0.0
优势：把繁琐的数据验证，简化为简单的链式配置
备注：含前面版本所有功能，不过 start 的参数，位置更改了
历史版本：https://github.com/linfenpan/fp-histroy/tree/master/pipe-valid

## 小例子

看两个小例子，感受一下PipeValid的魅力

普通的验证：
``` javascript
var name = "da宗熊";
var error = "";

if ( name.trim() === "") {
	error = "名字不能为空";
} else if (name.length > 20) {
	error = "名字长度不能超过20";
} else if (name.length < 2) {
	error = "名字不能小于2位";
}

if (error) {
	alert(error);
}
```

而使用了 PipeValid 后，你只需
``` javascript
var valid = new PipeValid();

valid.check("name")
	 .notEmpty("名字不能为空")
	 .max(20, "名字长度不能超过20")
	 .min(2, "名字不能小于2位");

var result = valid.start({ name: "da宗熊" });

if(!result.pass){
	alert(result.error);
}
```

## 优势

 1. 可复用的链式配置

 抛弃反锁的if、else的操作，使用链式定义，验证错误，其中的验证函数，更是定义一次，就可反复使用。

 ``` javascript
 valid.check("name")
 	.max(10, "xx...");
 ```

 2. 实例可反复使用

 同一个实例，同一份配置，调用不同的start，返回独立的结果

 ``` javascript
 // 多个start，使用相同配置，进行多个验证
 var result1 = valid.start({ name: "da宗熊" });
 var result2 = valid.start({ name: "da宗熊2" });
 ```

 3. 支持异步验证

 验证结果，返回一个简单的 promise/a 规范的对象，支持异步验证

 ``` javascript
 	valid.check('name')
		.define(function(val) {
			return new Promise(function(resolve, reject) {
				setTimeout(function() {
					if (val.indexOf('bad') >= 0) {
						reject();
					} else {
						resolve();
					}
				}, 1000);
			}, '名字里，不能含有"bad"关键字');
		});

	var result = valid.start({ name: 'da宗熊' });

	result.always(function() {
		// 如果 check 列表中，含有异步函数
		// 需要在此处，才能获取到正确的结果
		// result.pass/result.error/result.key/result.index
	});
 ```

 4. 内置常用验证器

 notEmpty: 非空
 min: 最小值，接受两个参数 valid.min(int, string);
 max: 最大值，接受两个参数 valid.max(int, string);
 url: 链接
 int: 整数
 number: 数字
 email: 邮件


 5. 良好的拓展

 自定义链式函数：

 ``` javascript
 // 定义新的验证函数
 PipeValid.define("isBear", function(val){
	 return val === "bear";
 });

 // 使用新的链式函数
 valid.check("bear")
 	.notEmpty("bear字段不能为空")
	.isBear("bear必须是bear!");

 valid.start({ bear:"xx" }); // ⇒ { pass: false, key: "bear", error: "bear必须是bear!" }
 ```

 新的isBear链式函数，第1个参数，永远是需要被验证的值。

 自定义验证函数:
  ``` javascript
 valid.check("min")
	 .define(function(val){
		 return +val >= 3;
	 }, "min最小是3");

 valid.start({min: 1}); // ==> {attr: "min", error: "min最小是3"}
 ```

 6. 条件验证

 只有满足某种需求(判断)，才执行的验证

 ``` javascript
 // 如果url的值不为空，则验证它是否链接；为空，则什么都不干
 valid.check("url")
 	.notEmpty()
	.then()
	.url("输入必须是链接")
	.end();

 valid.start({ url: "" }); // ⇒ {pass: true}
 valid.start({ url: "xxyy" }); // ⇒ { pass: false, key: "url", error: "输入必须是链接" }
 ```

 使用了then之后，之前添加的函数，则会转化为验证前的条件，而end则是then函数的结束。

 如果本次check操作，没有后续的验证，end函数可忽略。


 7. 支持属性表达式

 如果你想验证 "data.code" 或 "list[1].name" 这种表达式，PipeValid 可以帮到你。

 ``` javascript
	var valid = new PipeValid();

	valid.check('data.code')
		.int('code必须是整型');

	var result = valid.start({
		data: { code: '789d' }
	});

	result.pass === false;
 ```

------------------------------

## API

### PipeValid

1. check(name: String|Object)
返回一个 ```Item``` 实例，该实例拥有定义的所有验证方法

``` javascript
var pipe = new PipeValid();
var checker = pipe.check('name');

checker.min(3, '名字最短3位');
```

如果参数，是一个对象，则调用 ```rule``` 方法

name如果是字符串，支持属性表达式的写法:
``` javascript
pipe.check('data.code'); // 检测 data 的 code 属性
pipe.check('list[].name'); // 检测 list 列表中，所有子项的 name 属性
pipe.check('list[0].name'); // 检测 列表 的第 1 位子项的 name 属性
pipe.check('[].name'); // 检测该列表的所有 name 属性
```
所以说，属性名字，千万别包含"[]."哦~~。


2. rule(checkList: Object)
以数组形式，配置验证器

``` javascript
pipe.rule({
	// 多个验证规则，同时也支持 then 和 end 方法
  name: [
    ['notEmpty', '不能为空'],
    ['min', 3, '最少3位']
  ],
	// 单个验证规则
  age: ['int', '必须是整数']
});
```

规则的配置形式如下:

``` javascript
[name: String|Function, 验证参数1...?, error: String|Object]
```

可有多个验证参数，不过数量，要严格等于验证函数的参数数量减一


3. define(name: String, fn: Function)
在 ```Checker``` 增添新的验证方法

``` javascript
PipeValid.define('isBear', function(value){
  return value === 'bear';
});

checker.isBear('必须是bear!');
```
PipeValid.define 等价于 pipe.define，只是 pipe.define 之后，继续返回 this 对象


4. start(data: Object, restrict: Array?, isCheckAll: Boolean?)
 - data是需要验证的对象，
 - restrict是规定，本次验证，使用哪些 checker，字符串数组哦
 - isCheckAll，本次验证，是否返回所有错误？result.error将会是数组

 该方法，总是返回一个 Thenable 对象，有 then/always/catch 方法。
 如果执行的所有checker，都没有异步检测，结果将会是同步返回，
 如果有异步的检测，结果同样会异步返回。

 ``` javascript
 var pipe = new PipeValid();

 // 假设 noneBadword 是异步验证
 pipe.check('name')
 	.min(3, '名字最短3个字')
	.noneBadword('不能含有非法关键字');

 var result = pipe.start({ name: 'da宗熊' });

 result.pass // undefined，因为需要等待 noneBadword 的执行

 result.always(function() {
	 result.pass // 得到最终的结果
 });
 ```

 注意：

 如果定义了 check('name')，但是，在 start({ age: 1 }) 中，又不含有 name 属性，那么 name 属性的检测，将会被忽略。

 如果一定要验证，请指定 restrict 列表，start({ age: 1 }, ['name', 'age'])，有 restrict 列表，则只会验证列表指定的内容，同时，如果发现内容不存在，也会抛出设定的错误。

### PipeValid.Item

当 PipeValid 实例，调用 check(String) 方法时，将返回一个 Item 对象

1. 内置验证
 - max(len: Int, error: String|Object)
 - min(len: Int, error: String|Object)
 - url(error: String|Object)
 - int(error: String|Object)
 - email(error: String|Object)
 - notEmpty(error: String|Object)

所有 Item 实例，都默认拥有上面全部验证方法


2. define(fn: Function, 参数2?, 参数3?, error: String|Object)
自定义错误验证，其中验证函数 fn 的第1个参数，必定是需要验证的值

``` javascript
pipe.check('word')
	.define(function(val, parm1, params) {
		// 返回 true -> 验证通过
		// 返回 false -> 验证不通过
		// 返回 promise 对象，如果是 reject 不通过，resolve 则通过
		// promise对象的 reject 如果附带参数，则会把 error 覆盖掉！！！
	}, 'param1', 'param2', 'error text');
```

其中，如果自定义的函数，只有 val 一个参数，那么对应的，"参数2?, 参数3?" 则不该存在


3. then() 和 end()
then, 把前面链条中的所有方法，更变为验证生效的条件。
end, 结束本次 then 操作

``` javascript
// 如果当前的值，不为空，才去验证 url 是否链接
pipe.check('url').notEmpty()
	.then()
	.url('必须是链接');

// 如果 text 大于20，则验证是否连接，否则判定 text 是否整数
pipe.check('text')
	.min(20)
	.then()
	.url('text必须是链接')
	.end()
	.int('请输入整数');
```

4. check(Name: String)
调用父亲的check方法


5. custom(fn: Function(val, next: Function))
完全自定义的验证，fn中的this上下文，被更改为一个拥有当前所有验证器的对象。

``` javascript
/*
	max 验证其定义如下:
	max: function(val, len){
    val = "" + val;
    return val && val.length <= len;
  }
*/

pipe.check('name')
	.custom(function(val, next) {
		// 判定当前 val 长度小于等于10
		if (this.max(10)) {
			// 执行是否整数的验证
			if (!this.int()) {
				// 往外抛出错误
				next('输入必须是整数');
			}
		}
		// 没有错误，通知继续执行
		next();
	});
```

在 custom 的函数里，this 方法调用的所有 验证器，都默认绑定了 val 的参数。
如果在 this 的验证函数中，设置了错误，那么，该验证错误时，立刻中断函数的执行，抛出错误。
但是，如果是异步验证函数，则需要在其发生 reject 时，才能中断，所以要小心处理异步函数了。

上述代码，等价于
``` javascript
pipe.check('name')
	.custom(function(val, next) {
		// 判定当前 val 长度小于等于10
		if (this.max(10)) {
			// 执行是否整数的验证，如果不是整型，则抛出错误
			this.int('输入必须是整数');
		}
		// 没有错误，通知继续执行
		next();
	});
```


### PipeValid.Thenable

一个仿 Promise 的对象，只提供了 reject/resolve/then/always/catch 方法

``` javascript
var thenable = new Thenable();

thenable.resolve(1);

thenable.then(function(data) {
	console.log(data); // 1
})
.then(function(data) {
	console.log(data); // undefined
	return {};
})
.then(function(data) {
	console.log(data); // {}
});
```

-------------------------

## 联系

有BUG，or 兴趣的，可以联系，企鹅邮箱: 1071093121@qq.com
