# 数据验证

最近做后台比较多，路七八糟的数据验证，弄得不厌其烦。SO，弄了个表单验证的玩意出来，达到快速，简介，不烦人的验证。

下面看看，几种方式的数据验证，有什么不同。先有需要验证的数据:
``` html
<form>
	<input type="text" name="name" />
	<input type="text" name="password" />
	<input type="number" name="age" />

	<input type="checkbox" name="sex" value="0" /> 男
	<input type="checkbox" name="sex" value="1" /> 女

	<input type="text" name="address" />
	<input type="text" name="phone" />
	<input type="text" name="qq" />
	<input type="text" name="email" />
	<input type="text" name="homePage" />
</form>
```

咋眼一看，林林统统，需要验证的数据，有9个:

 1. name: 非空，最小3位，最大10位
 2. password: 非空，最小6为，最大20位
 3. age: 非空，整数
 4. sex: 非空
 5. address: 非空，最长50位
 6. phone: 可空，电话号码
 7. qq: 可空
 8. email: 可空，邮箱
 9. homePage: 可空，链接

---

## 传统

拿到这堆数据，那没啥好说的，逐个if/else判断吧:
``` javascript
if( name == "" ){
	return "name不能空";
}else if( name.length < 3){
	return "name不小于3";
}else if( name.length > 10 ){
	return "name不大于10";
}
....
....
每个条件一端判定

```

可以看出，如果再增加一个判定，则需要新的一个if，新一个return。如果只是一两个数据还好，但是，数据一多，简直就无法看下去了。

而且，表单的数据，一般会有新增和修改两部分，而它们的数据验证，往往是大部分一致，少部分不一样。OMG，又得把密密麻麻的判断拷一份，差不多一式两份......

简直就是灭绝人性的灾难啊...........................

---

## 策略模式

因为同一个属性，它的验证是一致的，所以，我们可以弄一份策略配置:

``` javascript
var obj = {
	name: function(val){
		if( val == "" ){
			return "name不能空";
		}else if( val.length < 3){
			return "name不小于3";
		}else if( val.length > 10 ){
			return "name不大于10";
		}
	},
	password: function(val){
		if( val == "" ){
			return "password不能空";
		}else if(val.length < 6){
			return "password不小于6位";
		}else if(val.length > 20){
			return "password不大于20位";
		}
	}
	...
	...
}
```
辛辛苦苦，写好一份配置，然后，验证的时候，只需要提供下需要验证的数据，循环执行，则OK:
``` javascript
function valid(data){
	for(var i in data){
		var item = data[i], fn = obj[i]; // 获取 obj 中配置的策略
		if( fn ){
			// 执行策略中的函数
			var res = fn[item];
			// 如果有返回，就是产生了错误
			if( res ){
				return res;
			}
		}
	}
	// 平安的执行到这里
	return true;
}
```
策略好了，调用的工具方法也好了，剩下就是使用:

``` javascript
var res = valid({
	name: "名字",
	password: "密码...",
	...
	...
});

if( res === true ){
	alert("验证通过");
}else{
	alert("验证错误:" + res);
}

```

做到了一次定义验证方法，重复利用。乍一看，也没啥问题。感觉验证代码，走到了代码界的巅峰，无可挑剔了，有木有？

但再细看，某些地方，还是不尽人意的。如果，现在新增一个字段，博客首页:  blogPage，链接。
很简单的，在 obj 中，新增一个策略，验证链接。

但是，我们之前不是已经有 homePage 策略，也有链接的验证吗？两块不是就重复了吗？
有强迫症的孩子，肯定就已经把 链接 验证代码，抽取成独立函数，供两边调用了。

但随着 有着 公共验证代码 的 接口，越来越多呢？OMG，密密麻麻的公共验证代码，又是一个灾难......

又或者，有一个新的表单，有着不同的数据呢？再定义一个策略对象？


---

## 配置策略

如果我们将策略模式，反其道而行，把验证的代码，变成策略对象，给需验证的数据，配置验证的策略。

代码我懒，就不洗写了:
``` javascript
var obj = {
	notEmpty: function(){...},
	max: function(){...},
	min: function(){...},
	url: function(){...},
	email: function(){...},
	qq: function(){...},
	number: function(){...},
	...
	...
}
```
定义一个验证数据需要的函数的对象，然后，给每个数据，指定要验证的接口:

``` javascript
var checkObj = {
	name: ["notEmpty|不能空", "max|10|最大10", "min|3|最小3"],
	password: ["notEmpty|不能空", "max|20|最大10", "min|6|最小6"],
	...
	...
}
```
使用上，也很简单，从 checkObj 中，找到验证的接口KEY，然后通过 obj[KEY] 找到真正的 验证 函数，进行验证。
至于如何实现，这里就呵呵了......

将一个简单的验证，分为了3层，简直堪比 MVC 啊，有木有啊？
但是，挺欣赏这一种方式的，完全为了那种不能忍受重复代码的强迫症患者，量身订造的，有没有？

---

# PipeValid.js

PipeValid.js，是根据配置策略的模式，编写了一个数据验证的工具库。其中，有这很强大的链式表达式语法，内置了常用的 数字、整数、非空、url、email、最小、最大的验证，支持拓展底层验证接口，或非接口验证。

打个栗子:

``` javascript
var valid = PipeValid();	// 支持非 new 模式的生成，也可以添加new

// 配置一系列验证操作

valid.check("name").notEmpty().error("名字不能为空")
					.max(15).error("名字最大不超过15字")
					.min(3).error("名字最小3位");

// error信息的智能写法，验证函数的最后一位，是错误信息
valid.check("password").notEmpty("密码不能空")
						.max(20, "密码最大20")
						.min(6, "密码最小6");

// 调用 start，开始验证
// 传入多少数据，验证多少
// start后，返回 Deferred 对象
valid.start({
	name: "xxxx",
	password: "yyyyy",
	...
	...
}).done(function(){
	// 全部验证通过
}).error(function(err){
	console.log(err);
	// err = {attr: "验证的属性名", error: "错误信息"}
}).always(function(){
	// 无论成功OR失败，总觉得，这里没什么用...
	// 之后版本干掉它
});
```

在check中，进行数据验证的配置，start中，才进行真正的验证的处理。而且，支持拓展自己的验证:

``` javascript
valid.add("isBear", function(val){
	return val === "da宗熊";
});

// 使用
valid.check("bear").isBear("竟然不是da宗熊!!不通过");
```
留意到check()后跟着的 isBear 没？经过add函数，isBear就能很智能的识别出，第一个参数，就是错误处理信息。

内置了 强大的 then/end 功能。如要验证: homePage 字段，它可空，不为空是，必须是链接:

``` javascript
// 如果 homePage 不是空的时候，进行是否链接的验证
valid.check("homePage").notEmpty().then().url("homePage必须是链接").end();
```
then 一定要有 end 作为结尾。

或者，我们很任性的，想自定义函数，进行验证，PipeValid也满足你的要求:
``` javascript
// define 的第一个参数，是函数，改函数，只支持1个参数!!!

// 验证 xxx 字段，是否等于 xxx
valid.check("xxx").define(function(val){
	return val === "xxx";  // 一定要返回 Boolean 值
}, "这是xxx有错了");
```

公共验证数据管理:
``` javascript
// 它有公共数据管理的对象，不用每次 start 都把所有数据传入
// 把不更改的数据，传入 data 中，能节省每次 start 传入的数据
// 当然，相同名字时，start 的 优先于 data 的
valid.data({
	name: "xxx",
	age: 11,
	...
	...
});
```


## 最后

嗯，总结一下，使用 PipeValid.js，真心非常装逼。感觉整个人的逼格都高了，有木有啊？v 1.0.0 版本，就3.7K啊？

表示简单的，一两个数据的验证，真心不想用这玩意。但是数据太多时...... 大哥，给我来十份 PipeValid~


不就是邪龙个东西吗?
