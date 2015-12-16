var LJSON = require("./../LJSON.js");

// Lets create an environment with only 2 functions,
// inc (adds 1 to a number)
// loop (bounded for-loop with max depth of 1000)
var lib = {
    inc  : function(a){ return a + 1; },
    loop : function(limit,state,update){
        limit = Math.min(limit, 1000); // No more than 1000 loops
        for (var i=0; i<limit; ++i)
            state = update(state);
        return state;
    }
};

// With those primitives, you can encode a function
// that adds 10 to a number:
function add10($, x){
    return $("loop", 10, x, function(x){
        return $("inc",x);
    });
};

// Which works as expected:
var add10Str = LJSON.stringify(add10);
var add10Val = LJSON.parseWithLib(lib, add10Str);

console.log("add10 stringified : "+add10Str);
console.log("add10 to 5        : "+add10Val(5));
