/** by da宗熊 2015/07/22 */
// 验证器，真没有那么复杂，使用配置策略，则完成全部功能了
;!function(window, wName){

    // 林林统统的常用测试函数
    // 测试对象
    var VALID = {
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

    // 工具方法:
    var ID = 1; // 内置ID

// 1.1.0 版本，重写编译的方法

// 编译，无需太复杂
// var obj = {name: {vls:{then:"method|1|错误"}, {then:"method|错误"}], error:""}, password: {vls:[{if:["条件|1", "条件|2"], then:["method|错误"]}], error:""}};
// 如果有 if 条件，先判定 if 条件成立，再验证
// 如果没有 if 条件，则执行 then 条件的判定
// 考虑到，每一种方法，都会抛出错误
// 如果不设置 错误，则统一使用 配置 中的 error 作为错误信息

    // 表单验证
    function PipeValid(){
        if(!(this instanceof PipeValid)){
            return new PipeValid();
        }
        return this.init();
    };

    PipeValid.prototype = {
        init: function(){
            // 配置对象
            this._cf = {};
            // 执行列表，为了保证执行顺序
            this._list = [];
            // 内置数据
            this._data = {};
            // 内置检查函数
            this._valid = {};

            // 编译对象
            this._cur = null;
            this._cls = [];
            this._item = {};

            var valid = VALID;
            for(var i in valid){
                this.add(i, valid[i]);
            }
        },
        // 添加定义
        add: function(name, fn){
            this._valid[name] = fn;

            this[name] = function(){
                // var args = arguments, text = args.length > fn.length - 1 ? args[fn.length] : "fail attribute:" + name;
                var args = [].slice.call(arguments, 0);
                if( args.length === fn.length - 1 ){
                    args.push("fail attribute:" + name);
                }
                args.unshift(name);
                return this.compile("fn", args.join("|"));
            };
            return this;
        },
        // 自定义错误
        define: function(fn){
            var name = "valid_define_" + ID++;
            return this.add(name, fn), this[name].apply(this, [].slice.call(arguments, 1));
        },
        // 添加属性的配置对象
        _addItem: function(name){
            if( !this._cf[name] ){
                var item = {
                    name: name,
                    vls: [],
                    error: "发生错误:" + name
                };
                this._cf[name] = item;
                this._list.push(item);
            }
        },
        // 检查某个属性的检测对象
        // 每次 check 都是一次编译的开始
        check: function(name){
            this._addItem(name);
            return this.compile("name", name);
        },
        // 新的编译 Item
        _newCitem: function(){
            this._item = {
                then: [],
                "if": []
            };
            this._cls.push(this._item);
        },
        // 编译函数
        compile: function(type, text){
            // 一个编译对象: name: { vls: [{then:[], if:[]}, {then: []}], error: "", name: "" }
            switch ( type ) {
                case "name":
                    this._cur = this._cf[text];
                    if( this._cur ){
                        this._cls = this._cur.vls;
                        // 拿到列表中的最后一个对象，如果发现是空的，就使用
                        var len = this._cls.length;
                        if(len > 0){
                            var last = this._cls[len - 1];
                            if( last.then.length > 0 ){
                                // 不是，则新建一个
                                this._newCitem();
                            }else{
                                this._item = last;
                            }
                        }else{
                            // 没有数据，建立一条
                            this._newCitem();
                        }
                    }
                    break;
                case "fn":
                    var then = this._item.then;
                    then.push(text);
                    // this._newCitem();
                    break;
                case "then":
                    var then = this._item.then, cnd = this._item["if"];
                    cnd.push.apply(cnd, then);
                    // 清空 then
                    then.splice(0);
                    break;
                case "end":
                    // 给当前列表，再注册一个新对象，多余的空对象，如果不用，就干掉
                    this._newCitem();
                    break;
                case "error":
                    this._cur.error = text;
                default:

            }
            return this;
        },
        end: function(){
            return this.compile("end");
        },
        then: function(){
            return this.compile("then");
        },
        // 开始检查
        // @param isAll 是否抛出所有错误
        // @param data 被检查的数据
        start: function(isAll, data){
            // 遍历 this._cf 属性，验证错误..
            // name: { vls: [{then:[], if:[]}, {then: []}], error: "", name: "" }
            if( typeof isAll === "object" ){
                data = isAll;
                isAll = false;
            }

            // 错误列表
            var errorList = [];

            // 按照当前列表的顺序，查找数据
            var list = this._list;
            for(var i = 0, max = list.length; i < max; i++){
                var item = list[i], val = data[item.name];
                // 有数据，则验证
                if( item.name in data ){
                    var obj = this._cf[item.name], ls = obj.vls;
                    // then 中没有数据，则忽略, 有 if 条件，则if条件全部成立，在进行 then 判定
                    // vls: [{then:[max|1|错误], if:[]}, {then: []}]
                    for(var j = 0, jmax = ls.length; j < jmax; j++){
                        var jitem = ls[j], res;
                        // 如果验证不通过，则没必要往下执行了
                        if( jitem["if"].length > 0 && !this._executeCompileList(jitem["if"], val, data).res){
                            continue;
                        }
                        res = this._executeCompileList(jitem["then"], val, data);
                        if( !res.res ){
                            if( isAll ){
                                errorList.push({attr: item.name, error: res.error});
                                break;
                            }else{
                                return {attr: item.name, error: res.error};
                            }
                        }else{
                            continue;
                        }
                    }
                    // END 循环
                }
            }
            // END 循环
            return isAll ? errorList : {attr:null, error: false};
        },
        // 执行需要编译的 错误配置列表
        // {then:[max|1|错误], if:[]}
        _executeCompileList: function(list, val, context){
            for(var i = 0, max = list.length; i < max; i++){
                var item = list[i];
                item = item.split("|");
                var fn = this._valid[item[0]];
                if( fn ){
                    var res = fn.apply( context || this._valid, [val].concat(item.slice(1, -1)) );
                    if( !res ){
                        return {res: false, error: item[item.length - 1]};
                    }
                }
            }
            return {res: true, error: ""};
        }
    };


    // 依附到window对象中
    window[wName || "PipeValid"] = PipeValid;
}(window, window.PIPEVALID);
