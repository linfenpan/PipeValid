# PipeValid.js —— 数据验证

最新版本：1.1.0
优势：把繁琐的数据验证，简化为简单的链式配置
升级日志，请看 1.1.0.md

## 小例子

看两个小例子，感受一下PipeValid的魅力

普通的验证：
``` javascript
var name = "da宗熊";

if( name == ""){
	return "名字不能为空";
}else if(name.length > 20){
	return "名字长度不能超过20";
}else if(name.length < 2){
	return "名字不能小于2位";
}
```

而使用了 PipeValid 后，你只需
``` javascript
var valid = new PipeValid();
valid.check("name")
	 .notEmpty("名字不能为空")
	 .max(20, "名字长度不能超过20")
	 .min(2, "名字不能小于2位");

var res = valid.start({name: "da宗熊"});
if(res.error){
	alert(res.error);
}
```

## 优势

 1. 链式配置

 抛弃反锁的if、else的操作，使用链式定义，验证错误
 ``` javascript
 valid.check("name").max(10, "xx...");
 ```

 2. 复用

 一次定义，重复使用，抛弃重复代码的烦恼
 ``` javascript
 // 多个start，使用相同配置，进行多个验证
 var res1 = valid.start({name: "da宗熊"});
 var res2 = valid.start({name: "da宗熊2"});
 ```

 3. 支持全数据验证

 遇到错误可立刻停止验证并抛出，也可以把所有数据全部验证后，把所有错误一次行抛出
 ``` javascript
 // 验证传入的所有数据
 // 返回错误列表
 var resList = valid.start(true, {name: "da棕熊", age: 20});
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

 可添加更多的链式验证函数，也可以自定义验证函数

 自定义链式函数：
 ``` javascript
 // 定义新的验证函数
 valid.add("isBear", function(val){
	 return val === "bear";
 });
 // 使用新的链式函数
 valid.check("bear").notEmpty("bear字段不能为空").isBear("bear必须是bear!");

 valid.start({bear:"xx"}); // ⇒ {attr: "bear", error: "bear必须是bear!"}
 ```
 新的isBear链式函数，被只能的添加了一个参数，用于处理错误信息

 自定义验证函数:
  ``` javascript
 valid.check("min").define(function(val){
	 // this 对象，是 {min: 1}
	 return +val >= 3;
 }, "min最小是3");

 valid.start({min: 1}); // ==> {attr: "min", error: "min最小是3"}
 ```

 6.  条件验证

 只有满足某种需求(判断)，才执行的验证
 ``` javascript
 valid.check("url").notEmpty().then().url("输入必须是链接").end();

 valid.start({url: ""}); // ⇒ {attr: null, error: false}
 valid.start({url: "xxyy"}); // ⇒ {attr: "url", error: "输入必须是链接"}
 ```
 使用了then之后，之前添加的函数，则会转化为验证前的条件，而end则是then函数的结束。

 上面第一条语句，语意就变为这样子：
 "如果url的值不为空，则验证它是否链接；为空，则什么都不干。"


## 最后

PipeValid是一个小型的验证函数库，所有api，已经在上面列举了。因为想保持它的最小化，所以，并没有做异步函数的支持。而且提供的验证函数，也不多。需要的同学，可自己拓展哈。

感兴趣的同学，或发现BUG的同学，可以联系本人，企鹅邮箱: 1071093121@qq.com

做这玩意的初衷: 我是不会告诉大家，完全是因为if/else看起来不够高大上的说。。。
