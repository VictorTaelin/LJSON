var LJSON = require("./../LJSON.js");

// Defines a JS function as usual
var helloWorld = function(x){
    return "Hello, world!";
};

// Serializes the function as a string with `stringify`
var helloWorldStr = LJSON.stringify(helloWorld);

// Gets the value back using `parse`
var helloWorldVal = LJSON.parse(helloWorldStr);

// Test it:
console.log(helloWorldVal(0));


