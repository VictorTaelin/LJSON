// That is just a note to say that even without primitives to deal with JS values, you
// can still do a lot in LJSON alone. Indeed, any computable function is expressible
// in LJSON. For example, with some λ-fu, we can define `fibonacci` with church numbers:

var LJSON = require("./../LJSON.js");

fib    = LJSON.parse("(v0)=>(v0((v1)=>(v1((v2)=>((v3)=>((v4)=>(v4(v3)((v5)=>((v6)=>(v2(v5)(v3(v5)(v6)))))))))))((v7)=>(v7((v8)=>((v9)=>(v9)))((v10)=>((v11)=>(v10(v11))))))((v12)=>((v13)=>(v12))))")
seven  = LJSON.parse("(f)=>((x)=>(f(f(f(f(f(f(f(x)))))))))");
logChu = (lam) => console.log(lam ((a)=>a+1) (0)) // Prints a church number on JavaScript.

// Prints 13, because `fib(7) == 13`.
logChu(fib(seven));

// Of course, you'd not use that over the std lib - but that is to say the power is there.
