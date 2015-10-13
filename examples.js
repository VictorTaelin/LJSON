LJSON = require("./ljson.js")

// TODO: add simpler examples

// Example #1: trusting an user-defined array library.

// Suppose you want your users to define an array library for you, but you
// don't trust them. As a good programmer, you know that using `foldr` and
// `cons` as primitives, one is able to encode any array-manipulating
// algorithm. So, you enable those primitives and nothing else.

// A creative user, then, writes this function that, given the promised
// primitives, returns 3 new functions: `foldl`, `reverse` and `concat`.

function userLib(foldr,cons){
    function id(x){
        return x;
    };
    function foldl(snoc,nil,array){
        function cons(head,tail){ 
            return function(result){ 
                return tail(snoc(result,head));
            };
        };
        return foldr(cons, id, array)(nil);
    };
    function reverse(array){
        return foldl(function(head,tail){return cons(tail,head)}, [], array);
    };
    function concat(a,b){
        return foldr(cons,foldr(cons,[],b),a);
    };
    return {
        foldl   : foldl,
        reverse : reverse,
        concat  : concat};
};

// That user stringifies his library and sends it to you via sockets:
var userLibStr = LJSON.stringify(userLib);

// For the curious, this is the stringification of `userLibStr`:
//    (function(v0, v1) {
//        return {
//            foldl: (function(v2, v3, v4) {
//                return v0((function(v5, v6) {
//                    return (function(v7) {
//                        return v6(v2(v7, v5))
//                    })
//                }), (function(v8) {
//                    return v8
//                }), v4)(v3)
//            }),
//            reverse: (function(v9) {
//                return v0((function(v10, v11) {
//                    return (function(v12) {
//                        return v11(v1(v10, v12))
//                    })
//                }), (function(v13) {
//                    return v13
//                }), v9)([])
//            }),
//            concat: (function(v13, v15) {
//                return v0(v1, v0(v1, [], v15), v14)
//            })
//        }
//    })

// You recover his original code by parsing that string:
var userLib = LJSON.unsafeParse(userLibStr);

// Now, to get the actual lib, you need to give it the promised primitives:
function foldr(cons, nil, array){
    var result = nil;
    for (var i=array.length-1; i>=0; --i)
        result = cons(array[i],result);
    return result;
};
function cons(head, tail){
    return [head].concat(tail);
};
var lib = userLib(foldr, cons);

// You can then use his code safely, knowing he won't steal your password or
// mine bitcoins, because you gave him no power other than array manipulation.
// On this particular case, you can also be sure his programs will halt.
console.log(lib.reverse([1,2,3]));
console.log(lib.concat([1,2,3],[4,5,6]));

