var LJSON = require("./../LJSON.js");


// First example

// A random JS object with a pure function inside.
var person = {
    name : "John",
    mail : function(msg){ return { author  : "John", message : msg}; }
};

// If JSON was used, the `mail` field would be stripped from `personVal`.
var personStr = LJSON.stringify(person); 
var personVal = LJSON.parse(personStr);
var mail      = personVal.mail("hello"); // would crash with JSON

// But, since `mail` is pure, LJSON can deal with it correctly:
console.log("Serialized value : " + personStr);
console.log("Calling mail     : " + LJSON.stringify(mail));


// Hypotenuse example

hypotenuse = function($,a,b){
    return $("sqrt",$("+",$("*",a,a),$("*",b,b)));
};
var hypotenuseStr = LJSON.stringify(hypotenuse);
var hypotenuseVal = LJSON.parseWithStdLib(hypotenuseStr);
console.log(hypotenuseVal(3,4));


// Crazy example

console.log(LJSON.stringify(function(a){
    // Things known at compile time are evaluated.
    var arr = [];
    for (var i=0; i<10; ++i)
        arr.push(i*10);

    // Even inside functions.
    var foo = function(x){
        if (arr[5] < 10)
            var bird = "pidgey";
        else
            var bird = "pidgeott";
        return bird;
    };

    // Even λ-calculus expressions!
    var C3  = function(f){return function(x){return f(f(f(x)))}};
    var C27 = C3(C3); // church number exponentiation of 3^3

    return [
        arr,
        foo,
        C27];
}));
