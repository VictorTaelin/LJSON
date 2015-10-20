// LJSON: JSON extended with pure functions.

var parsenhora = require("./parsenhora.js");

var LJSON = (function LJSON(){
    // stringify :: LJSON -> String
    // Stringifies a LJSON value. 
    function stringify(value){
        var nextVarId = 0;
        return (function normalize(value){
            // This is responsible for collecting the argument list of a bound
            // variable. For example, in `function(x){return x(a,b)(b)(c)}`, it
            // collects `(a,b)`, `(b)`, `(c)` as the arguments of `x`. For
            // that, it creates a variadic argumented function that is applied
            // to many arguments, collecting them in a closure, until it is
            // applied to `null`. When it is, it returns the JS source string
            // for the application of the collected argument list.
            function application(varName, argList){
                var app = function(arg){
                    if (arg === null) {
                        function stringifyCall(args){
                            return "("+args.join(",")+")"
                        }
                        return varName + (argList.length===0 ? "" : argList.map(stringifyCall).join(""));
                    } else {
                        var args       = [].slice.call(arguments,0);
                        var newArgList = argList.concat([args.map(normalize)]);
                        return application(varName, newArgList);
                    };
                };
                app.isApplication = true;
                return app;
            };
            // If we try to normalize an application, we apply
            // it to `null` to stop the argument-collecting.
            if (value.isApplication) 
                return value(null);
            // If it is a function, we need to create an application for its
            // variable, and call the function on it, so its variable can start
            // collecting the argList for the places where it is called on the
            // body.  We then normalize the resulting body and return the JS source
            // for the function.
            else if (typeof value === "function") {
                var argNames = [];
                var argApps  = [];
                for (var i=0, l=value.length; i<l; ++i){
                    var argName = "v"+(nextVarId++);
                    var app     = application(argName, []);
                    argNames.push(argName);
                    argApps.push(app);
                };
                var body = normalize(value.apply(null,argApps));
                return "("+argNames.join(",")+")=>("+body+")";
            // For container types (objects and arrays), it is just a matter
            // of calling stringify on the contained values recursively.
            } else if (typeof value === "object") {
                if (value instanceof Array){
                    var source = "[";
                    for (var i=0, l=value.length; i<l; ++i)
                        source += (i?",":"") + normalize(value[i]);
                    return source+"]";
                } else if (value instanceof Date){
                    return null;
                } else {
                    var source = "{";
                    var i      = 0;
                    for (var key in value)
                        source += (i++?",":"") + JSON.stringify(key) + ":" + normalize(value[key]);
                    return source+"}";
                };
            // For unit types, we just delegate to JSON.stringify.
            } else if 
                (  typeof value === "string" 
                || typeof value === "number" 
                || typeof value === "boolean")
                return JSON.stringify(value);
            else return null;
        })(value);
    };

    // parse :: String -> LJSON
    // Parses a LJSON String into a LJSON value.
    // The value returned is guaranteed to be safe - i.e., all functions 
    // inside it are pure and have no access to the global scope.
    // TODO : tests, add more comments.
    function parse(str){
        // Note: Unfortunatelly, JavaScript doesn't provide any way to create
        // functions dynamically other than using `eval` on strings, so LJSON's
        // parser can't return JS values directly and needs to instead produce
        // a string to use `eval` on. This is perfectly safe as LJSON's
        // functions are pure and any unbound variable (i.e, reference to the
        // global scope) is detected here as parse error - yet, it could be a
        // bit faster if ECMAs provided a better way to build functions.
        return eval("("+parsenhora(function(P){
            // insert :: forall a . Object -> String -> a -> Object
            // Inserts a keyVal pair into an object (purely).
            function insert(newKey,newVal,object){
                var result = {};
                for (var key in object)
                    result[key] = object[key];
                result[newKey] = newVal;
                return result;
            };

            // A LJSON value is one of those:
            // - a JSON bool   (ex: true); 
            // - a JSON number (ex: `7.5e10`);
            // - a JSON string (ex: `"sdfak"`);
            // - a JSON array  (ex: `[1,2,"aff"]`);
            // - a JSON object (ex: `{"a":1, "b":"ghost"}`);
            // - the JSON null (ex: null);
            // - a LJSON function following the grammar:
            //     (var0, var1, varN) => body
            // - a LJSON variable following the grammar:
            //     variable(arg0a,arg1a,argNa)(arg0b,arg1b,argNb)...
            function LJSON_value(binders,scope){
                return function(){
                    return P.choice([
                        LJSON_number(binders,scope),
                        LJSON_string(binders,scope),
                        LJSON_array(binders,scope),
                        LJSON_object(binders,scope),
                        LJSON_application(binders,scope),
                        LJSON_lambda(binders,scope)])();
                };
            };
            function LJSON_boolean(binders,scope){
                return choice([P.string("true"),P.string("false")]);
            };
            function LJSON_null(binders,scope){
                return P.string("null");
            };
            function LJSON_number(binders,scope){
                return function(){
                    // Parses a LJSON Number, following
                    // the same grammar as JSON.
                    var result = "";

                    // Optional leading minus signal.
                    var minus = P.chr("-")();
                    if (minus !== null)
                        result += "-";

                    // First character must be 0~9.
                    var leadingDigit = P.digit();
                    if (leadingDigit === null) 
                        return null;
                    result = result + leadingDigit; 
                    
                    // If the leading digit isn't 0,
                    // the number could have more digits.
                    if (leadingDigit !== "0")
                        result += P.many(P.digit)().join("");

                    // Optionally, we can have a dot 
                    // followed by more digits.
                    var dot = P.chr(".")();
                    if (dot !== null)
                        result = result + "." + P.many(P.digit)().join("");

                    // Optionally, we can have the exp letter 
                    // followed by an optional sign and more 
                    // digits, for scientific notation.
                    var e = P.choice([P.chr("e"),P.chr("E")])();
                    if (e !== null){
                        result += "e";
                        if (P.chr("+")() !== null)
                            result += "+";
                        else if (P.chr("-")() !== null)
                            result += "-";
                        result += P.many(P.digit)().join("");
                    };

                    // All that satisfied, that is a valid 
                    // JSON and, thus, LJSON Number, and can 
                    // be parsed to a JavaScript Number.
                    return result;
                };
            };
            function LJSON_string(binders,scope){
                return function(){
                    function isStringCharacter(c){
                        return c !== '"' && c !== '\\';
                    };
                    
                    var openQuote = P.chr('"')();
                    if (openQuote === null)
                        return null;

                    for (var result = "", c = P.get(); c !== null && c !== '"'; c = P.get()){
                        if (isStringCharacter(c)){
                            result += c;
                        } 
                        else if (c === "\\"){
                            var slashed = P.get();
                            switch (slashed){
                                case '"' : result += '\\"'; break;
                                case "\\": result += "\\"; break;
                                case "/" : result += "\\/"; break;
                                case "b" : result += "\\b"; break;
                                case "f" : result += "\\f"; break;
                                case "n" : result += "\\n"; break;
                                case "r" : result += "\\r"; break;
                                case "t" : result += "\\t"; break;
                                case "u" :
                                    var hexs = P.sequence([hex,hex,hex,hex])();
                                    if (hexs === null)
                                        return null;
                                    result += "\\"+hexs.join("");
                                    break;
                                default: return null;
                            };
                        };
                    };
                    return '"'+result+'"';
                };
            };
            function LJSON_array(binders,scope){
                return function(){
                    var result = P.betweenSpaced(
                        P.chr("["),
                        P.intercalatedSpaced(
                            LJSON_value(binders,scope), 
                            P.chr(",")),
                        P.chr("]"))();
                    if (result === null)
                        return null;
                    return "["+result.join(",")+"]";
                };
            };
            function LJSON_object(binders,scope){
                return function(){
                    function keyVals(){
                        var keyVals = P.intercalatedSpaced(
                            P.pairSpaced(
                                LJSON_string(binders,scope), 
                                P.chr(":"), 
                                LJSON_value (binders,scope)), 
                            P.chr(","))();

                        if (keyVals === null)
                            return null;

                        var result = "{";
                        for (var i=0, l=keyVals.length; i<l; ++i)
                            result += (i>0?",":"") + [keyVals[i][0]] + ":" + keyVals[i][1];
                        result += "}";

                        return result;
                    };

                    return P.betweenSpaced(P.chr("{"),keyVals,P.chr("}"))();
                };
            };
            function LJSON_lambda(binders,scope){
                return function(){
                    var varList = P.betweenSpaced(
                        P.chr("("),
                        P.intercalatedSpaced(P.word,P.chr(",")),
                        P.chr(")"))();

                    if (varList === null)
                        return null;

                    var arrow = P.sequence([
                        P.skipSpaces,
                        P.string("=>"),
                        P.skipSpaces])();

                    if (arrow === null)
                        return null;

                    var newScope = {};
                    for (var key in scope)
                        newScope[key] = scope[key];
                    for (var i=0, l=varList.length; i<l; ++i)
                        newScope[varList[i]] = binders + i;

                    var body = P.betweenSpaced(P.chr("("),LJSON_value(binders+varList.length, newScope),P.chr(")"))();
                    var args = varList.map(function(name,i){return "v"+(binders+i)}).join(",");

                    return "(function("+args+"){return "+body+"})";
                };
            };
            function LJSON_application(binders,scope){
                return function(){
                    var fn = LJSON_variable(binders,scope)();
                    if (fn === null)
                        return null;

                    var calls = P.many(P.between(
                        P.sequence([P.skipSpaces,P.chr("(")]),
                        P.intercalatedSpaced(LJSON_value(binders,scope), P.chr(",")),
                        P.sequence([P.chr(")"),P.skipSpaces])))();

                    return fn + calls.map(function(args){
                            return "("+args.join(",")+")";
                        }).join("");
                };
            };
            function LJSON_variable(binders,scope){
                return function(){
                    var name = P.word();
                    if (name === null)
                        return null;
                    if (scope[name] === undefined)
                        throw ("LJSON parse error: "+name+" is not defined");
                    return "v" + scope[name];
                };
            };

            return LJSON_value(0,{});
        })(str)+")");
    };

    // unsafeParse :: String -> LJSON
    // Parses an arbitrary String into a LJSON value.
    // This function is faster than `parse`, but unsafe - the code you call
    // this on will be executed and could do every kind of harm.
    function unsafeParse(a){
        return eval(a);
    };

    // withLib :: Function -> Function
    // LJSON defines no primitives, so you can't do anything with JS values
    // from inside LJSON functions. For example, you are able to receive
    // numbers as arguments of, but not sum them. In order to do that, you need
    // to manually give the LJSON function the primitives it needs to operate.
    // That is cumbersome and repetitive, so `withLib` is just a convenient
    // utility to enable a LJSON function to access your own set of primitives. 
    // It works by reserving the first argument as an accessor to your library:
    // Example:
    //
    // // Your own lib defining the multiplication operation, "*":
    // var myLib = {"*" : function(a,b){ return a*b; }};
    //
    // // Doubles a JS number using your lib's "*":
    // function double(L,a){
    //     return L("*",a,2);
    // };
    // var doubleStr = LJSON.stringify(double);            // stringifies to send/store
    // var doubleVal = withLib(myLib,LJSON.parse(double)); // parses into a JS value and enables your lib
    //
    // console.log(double(4)); // output: 8
    function withLib(lib,fn){
        return function(){
            var args = [].slice.call(arguments,0);
            var call = function(primName){
                var args = [].slice.call(arguments,1);
                return lib[primName].apply(null,args);
            };
            return fn.apply(null, [call].concat(args));
        };
    };

    // withStrLib :: Function -> Function
    // A standard lib with the set of common JavaScript functions.
    // TODO: complete this.
    function withStdLib(fn){
        return withLib({
            "+"    : function(a,b){return a+b},
            "-"    : function(a,b){return a-b},
            "*"    : function(a,b){return a*b},
            "/"    : function(a,b){return a/b},
            "sqrt" : function(x){return Math.sqrt(x)}
        },fn);
    };

    // parseWithLib :: Object of functions -> String -> Function
    // Convenient function to parse and use `withLib`.
    function parseWithLib(lib,src){
        return withLib(lib,parse(src));
    };

    // parseWithLib :: String -> Function
    // Convenient function to parse and use `withStdLib`.
    function parseWithStdLib(src){
        return withStdLib(parse(src));
    };

    return {
        stringify       : stringify,
        parse           : parse,
        unsafeParse     : unsafeParse,
        withLib         : withLib,
        withStdLib      : withStdLib,
        parseWithLib    : parseWithLib,
        parseWithStdLib : parseWithStdLib};
})();
if (typeof module !== "undefined") module.exports = LJSON;
