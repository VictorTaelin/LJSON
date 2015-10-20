var LJSON = require("./../LJSON.js");

// LJSON doesn't define any primitive - just function and function application.
// That means you can't do anything intersting with JS numbers, arrays, etc. -
// for that, you need to manually provide the primitivies yourself. Since that
// would be way too cumbersome and repetitive, there is a convenient helper that
// enables the common primitives such as addition, multiplication, array access
// etc. after you parse a function. It works as follows:

// First, you define your functions with an extra argument, "$".
// You can use `$` inside the function to access the common primitives.
var square = function($,x){
    return $("*",x,x);
};

// You stringify your function as usual:
var squareStr = LJSON.stringify(square);

// Now, instead of using `LJSON.parse`, you use `LJSON.parseWithLib`:
var squareVal = LJSON.parseWithStdLib(squareStr);

console.log(squareVal(4)); // outputs 16, as expected
