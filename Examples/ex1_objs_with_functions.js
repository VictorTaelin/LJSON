var LJSON = require("./../LJSON.js");

// Suppose you have the following JSON object:

var player = {
    name   : "John",
    atk    : 17,
    def    : 18,
    letter : function (msg){
        return {
            name    : "john",
            message : msg};
    }
};

// What happens if you use JSON.stringify on it?

var playerStr = JSON.stringify(player);
var playerVal = JSON.parse(playerStr);
// console.log(playerVal.letter("Hello."))

// This would be an error, because JSON doesn't define functions, so the field
// `letter` is stripped away from `playerVal`. In other words, the parsed value
// doesn't behave the same as the stringified value. But since `letter` is a
// pure function, you can use LJSON on it:

var playerStr = LJSON.stringify(player);
var playerVal = LJSON.parse(playerStr);
console.log(playerVal.letter("Hello."));

// That outputs: { name: 'john', message: 'Hello.' }
// As expected.
