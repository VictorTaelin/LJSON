var LJSON = require("./../LJSON.js");

// Defines a JS function as usual
var helloWorld = function (x) {
    return [null, true, false, undefined];
};

// Serializes the function as a string with `stringify`
var helloWorldStr = LJSON.stringify(helloWorld);

console.log(helloWorldStr);

// Gets the value back using `parse`
var helloWorldVal = LJSON.parse(helloWorldStr);

// Test it:
console.log(helloWorldVal(0));


