/** By da棕熊 2015/07/17 1.0.0 **/
;!function(window, wName){

// 一个数据验证，需要什么功能呢？
// 1、常用验证函数, max, min, null, email, url, phone 等
// 2、需要验证后，有结果反馈，最好每次验证，都独立返回
// 3、选择全部验证，还是单独验证
// 4、每条数据，应该有独立的验证规则
// 5、有明确的成功，失败回调

    // 林林统统的常用测试函数
    // 测试对象
    var VALID = {
        // max, min, empty, email, url, phone, number, int, float
        max: function(val, len){
            return val && val.length <= len;
        },
        min: function(val, len){
            return val && val.length >= len;
        },
        notEmpty: function(val){
            return val && val.replace(/^\s*|\s*$/g, "") !== "";
        },
        isEmpty: function(val){
            return !val || val.replace(/^\s*|\s*$/g, "") === "";
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

    // 内置 Deferred 对象
    function Deferred(){
        this._dones = [];
        this._fails = [];
        this._status = 0;   // 0 没完成, 1 done， 2 fail
        this._ctx = [];
    };
    Deferred.prototype = {
        // 执行某个列表
        _execute: function(list, args){
            this._ctx = args;
            for(var i = 0, max = list.length; i < max; i++){
                list[i].apply(this, args);
            }
        },
        resolve: function(){
            this._execute(this._dones, arguments);
            this._status = 1;
            return this;
        },
        reject: function(){
            this._execute(this._fails, arguments);
            this._status = 2;
            return this;
        },
        done: function(cb){
            this._dones.push(cb);
            this._status == 1 && cb.apply(this, this._ctx);
            return this;
        },
        fail: function(cb){
            this._fails.push(cb);
            this._status == 2 && cb.apply(this, this._ctx);
            return this;
        },
        always: function(cb){
            this.done(cb);
            this.fail(cb);
            return this;
        }
    };
    // window["Deferred"] = Deferred;

    // 工具方法:

    var ID = 1; // 内置ID

    // 对象的简单合并
    function extend(){
        var args = arguments, o1 = args[0];
        if(args.length >= 2){
            var list = [].slice.call(args, 1);
            for(var i = 0, max = list.length; i < max; i++){
                var obj = list[i] || {};
                for(var j in obj){
                    o1[j] = obj[j];
                }
            }
        }
        return o1;
    };

    // 编译
    // 内置错误编译器
    var CM_NAME = "", CM_OBJECT = {}, CM_LIST = [];
    function compile(text, type, fnNextItem){
        // 先创建一个空对象
        // 当三者齐全的时候，就编译为一个可执行的函数
        if( type == "attr" && CM_NAME != text ){
            // 结束上一次的编译
            // 如果还有错误的处理函数，则先保存
            compileBeforeNext();

            // 开始下一次的编译
            CM_OBJECT = fnNextItem(text);

        }else if( CM_OBJECT.attr ){
            // 获取当前编译的对象
            // 当前的语句，都放倒 __clist 中
            // 遇到 error 之后，结束一次语句声明
            // 所有的错误判定函数，放在 __cobj.fn 数组中
            var obj = CM_OBJECT, elist = CM_LIST;
            // 添加编译的数据
            switch (type) {
                case "fn":
                    elist.push(text);
                    break;
                // then 和 end 是配套使用的
                // 对应: [函数, 函数, {fn: []}] 这种模式
                case "then":
                    // 如果 elist 是空的，那忽略这里
                    if( elist.length > 0 ){
                        var item = compileItem(CM_OBJECT.attr);// {attr: , fn: [], _pt: elist};
                        item._pt = CM_OBJECT;

                        CM_LIST.push(item);
                        CM_OBJECT.fn.push(CM_LIST);

                        CM_LIST = [];
                        CM_OBJECT = item;

                    }
                    break;
                case "end":
                    // 如果 elist 有 _pt 属性，则修正，没有，则忽略
                    if( CM_OBJECT._pt ){
                        var item = CM_OBJECT._pt;
                        delete CM_OBJECT._pt;

                        CM_OBJECT = item;
                        CM_LIST = [];
                    }
                    break;
                case "error":
                    // 遇到 error，则结束一轮验证
                    // 如果遇到有 _pt 的，就不用加入到 obj 中了
                    if( elist.length <= 0){
                        obj.error = text;
                    }else{
                        elist.push(text);
                        obj.fn.push(elist);
                        // 清空之
                        CM_LIST = [];
                    }
                    break;
            }
        }
    };
    // 在编译下一个item前，进行处理
    // @param autoError 是否自动添加错误提醒
    function compileBeforeNext(autoError){
        var list = CM_LIST;
        if(CM_LIST.length > 0){
            if(autoError && CM_OBJECT && typeof list[list.length - 1] !== "string"){
                list.push("不通过:" + CM_OBJECT.attr);
            }
            CM_OBJECT && CM_OBJECT.fn && CM_OBJECT.fn.push(list);
            CM_LIST = [];
        }
    };
    // 获取编译的 ITEM
    function compileItem(name){
        return {
            attr: name,
            fn: [/*
                [函数, 函数, 错误], [函数, 函数, 对象: {fn: [函数, 函数, 错误]}]
            */]
        };
    };
    // 执行complieItem
    function executeCompileItem(item, val){
        var list = item.fn, error, iItem, last;

        // fn:[ [], [], [] ];
        for(var i = 0, max = list.length; i < max; i++){
            // 后面涉及到 切割 操作，所以，复制一份数组
            iItem = list[i].slice(0);    // [函数, 函数, 错误] 或 [函数, 函数, 对象]

            if(iItem.length <= 1){
                // 就是说，没有处理函数，或没有错误，忽略之
                // 不考虑第一个是对象的情况，那是错误的语法！！
                continue;
            }
            // 获取最后一个item， 错误 || 对象
            // 经过 splice 操作，iItem 已经去掉最后一个值
            last = iItem.splice(-1)[0];

            // 执行列表中的所有函数操作
            for(var m = 0, mmax = iItem.length; m < mmax; m++){
                var mItem = iItem[m], res;
                // 如果不是函数，则是错误的数据，忽略
                if( "function" === typeof mItem ){
                    var res = mItem(val);
                    // 验证不通过，就打算本次循环
                    if( !res ){
                        error = last;
                        break;
                    }
                }
            };

            // 产生了错误，判定是哪个 定义 发生的
            // [函数, 函数, 错误] 的，打断，往外层抛出结果
            // [函数, 函数, 对象] 的，不再往下执行
            if( error ){
                if( "string" === typeof last ){
                    //  [函数, 函数, 错误]
                    break;
                }else{
                    // 这时候，error = 对象，应该清空掉这个设置
                    // 然后继续遍历当前列表，找到下一个数组，然后继续遍历
                    error = "";
                }
            }else if( "object" === typeof last ){
                // [函数, 函数, 对象]
                // 这种模式的设计，和上一种，是完全相反的意思
                // 只有当前面的所有函数，都为 true 时，才检测 对象 的内容
                return executeCompileItem(last, val);
            }
        }
        return error ? {attr: item.attr, error: error} : true;
    }


    // 表单验证
    function PipeValid(){
        if(!(this instanceof PipeValid)){
            return new PipeValid();
        }
        return this.init();
    };

    PipeValid.prototype = {
        init: function(){
            // 验证列表，集合
            // 考虑到全部验证，需要按照顺序
            // 而之后，又想独立单个验证
            this._vlist = [];
            this._map = {};

            // 验证的数据
            this._data = {};

            // 把 _valid 的东西，全部放在当前对象中..
            var obj = VALID;
            for(var i in obj){
                this.add(i, obj[i]);
            }

            return this;
        },
        // 添加验证的数据
        data: function(name, value){
            if(typeof name === "object"){
                var arr = [this._data];
                arr.push.apply(arr, arguments);
                extend.apply(this, arr);
            }else if(arguments.length == 2){
                this._data[name] = value;
            }else if(arguments.length <= 0){
                return this._data;
            }
        },
        // 清空所有添加的数据
        clear: function(){
            this._data = {};
        },
        // 添加检测函数
        add: function(name, fn){
            this[name] = (function(fn, fname){
                // 当前函数参数数目，第一个是 value
                // 因为第一个参数, value，由执行函数传入，所以计算时，需要去掉
                var len = fn.length - 1;

                return function(){
                    var args = [].slice.call(arguments, 0);

                    // 可能多放一个参数，理论上，应该无所谓的
                    this.check("", function(val){
                        var list = args.slice(0, len);
                        // 在这里，加入了 value 参数
                        list.unshift(val);
                        return fn.apply(this, list);
                    });

                    if( args.length > len ){
                        this.check("", "", args[len]);
                    }

                    return this;
                }
            })(fn, name);
            return this;
        },
        // 自定义错误验证
        define: function(){
            var args = arguments;
            if( typeof args[0] !== "function" ){return;}

            // 添加到 定义 之中
            var name = "define_func_" + ID++;
            this.add(name, args[0]);

            // 加入验证
            this[name].apply(this, [].slice.call(args, 1));

            return this;
        },
        // 添加验证项
        _addItem: function(name){
            var map = this._map, item = map[name];
            if( !item ){
                item = map[name] = compileItem(name);
                this._vlist.push(item);
            }
            return item;
        },
        // 开始验证
        // @param isAll 是否全部数据验证一遍
        // @param data  需要验证的数据，并不会保存到 _data 中
        start: function(isAll, data){
            // 防止编译没完成
            compileBeforeNext(true);

            // 进行参数修正
            if( typeof isAll === "object"){
                data = isAll;
                isAll = false;
            }
            // 跟已有数据，进行合并，
            data = extend({}, this._data, data || {});

            // 遍历所有属性
            var errList = [];   // 错误列表

            // 声明一个延迟对象
            var def = new Deferred(), list = this._vlist, res, item, val;
            for(var i = 0, max = list.length; i < max; i++){
                item = list[i], val = item.attr;

                // 忽略 data 中没有的数据
                if( !data[val] ){
                    continue;
                };

                res = executeCompileItem(item, data[val]);

                if( res !== true ){
                    errList.push(res);
                    if( !isAll ){
                        return def.reject(res);
                    }
                }
            }
            // 如果有错误，则抛出
            return errList.length > 0 ? def.reject(errList) : def.resolve();
        },
        // 结果设置
        error: function(text){
            this.check("", "", text);
            return this;
        },
        // 条件验证判定
        then: function(){
            compile("", "then");
            return this;
        },
        end: function(){
            compile("", "end");
            return this;
        },
        // 加入检测列表中
        // @param attr 检测的属性名
        // @param vfn  检测的函数
        // @param text 错误信息
        check: function(attr, vfn, text){
            if(attr){
                var self = this;
                compile(attr, "attr", function(text){
                    return self._addItem(text);
                });
            }
            if(vfn){
                compile(vfn, "fn");
            }
            if(text){
                compile(text, "error");
            }
            return this;
        },
        // 挑几个内置的对象，进行验证
        // 验证的数据，必须已经在 _data 中
        // and，第一个参数，可以是需要验证的额外数据
        valid: function(data){
            var list = [].slice.call(arguments, 0), isAll = false;
            // 如果第一个参数，是个对象
            if( typeof data == "object" ){
                list.splice(0, 1);
            }else{
                data = {};
            }

            // 如果最后一个参数，是个Boolean值
            if( typeof list[list.length - 1] == "boolean"){
                isAll = list[list.length - 1];
            }
            // 如果第二个参数，是个列表
            if( typeof list[0] == "object" && list[0].length > 0){
                list = list[0];
            }

            // 把list中，所有的数据，转为需要验证个格式
            // 当前的数据，和默认的数据，进行一轮合并
            var item;
            for(var i = 0, max = list.length; i <  max; i++){
                item = list[i];
                data[item] = data[item] || this._data[item];
            }

            return this.start(isAll, data);

        }
    }


    // 依附到window对象中
    window[wName || "PipeValid"] = PipeValid;
}(window, window.PIPEVALID);
