## λJSON 

λJSON is a drop-in replacement for [JSON](http://www.json.org) which also includes pure functions. There are good security reasons for functions to be out of the JSON specs, but most of those are only significant when you allow arbitrary, side-effective programs. With pure functions, one is able to interchange code while still being as safe as regular JSON.

```JavaScript
var LJSON = require("LJSON");

function newPlayer(name){
    return {
        name      : name,
        hp        : 12,
        atk       : 5,
        def       : 5,
        inventory : []}
};

var newPlayerSource = LJSON.stringify(newPlayer); 
var John            = LJSON.parse(newPlayerSource)("John");

console.log("Serialized λJSON: " + newPlayerSource);
console.log("Parsed and applied: " + John);
```

Output:

    Serialized λJSON: (function(v0){return {name:v0,hp:12,atk:5,def:5,inventory:[]}})
    Parsed and applied: { name: 'John', hp: 12, atk: 5, def: 5, inventory: [] }

## More info

- [Normal Form](normal-form)
- [Primitives](primitives)
- [Safety](safety)
- [TODO](todo)

## Normal form

In the same way that JSON stringifies `3e10` as `300` - i.e., only the actual value, not the original source is preserved - λJSON stringifies functions using their [normal forms](https://en.wikipedia.org/wiki/Normal_form_(abstract_rewriting)). That is, for example:

```javascript
function(x){
    function id(x){
        return x;
    };
    return id(id(id(x)));
}
```

Is stringified as:
    
```javascript
(function(v1){return v1})
```
    
That is because both definitions are equivalent, i.e., they always return the received argument. That also means compile-time computations are always executed:

```javascript
function canIUseThat(what, where){
    var what  = "bike";
    var where = "indoor";
    switch (what){
        case "bike": switch (where){
            case "cave"  : return "Yes, it is a good time to use that."
            case "road"  : return "Yes, it is a good time to use that."
            case "indoor": return "No, it is not the time to use that."
        };
        case "escape rope": switch (where){
            case "cave"  : return "Yes, it is a good time to use that."
            case "road"  : return "No, it is not the time to use that."
            case "indoor": return "No, it is not the time to use that."
        };
    };
};
```

Is stringified as:

```javascript
(function(v0,v1){return "No, it is not the time to use that."})
```

Because the function always returns the same string.


## Primitives

LJSON only adds pure functions to JSON, so no primitive is available. That excludes mathematical operators, for-loops, conditionals etc. You can still use those when they can be removed before stringification:

```JavaScript
function repeat10Times(value){
    var result = [];
    for (var i=0; i<10; ++i)
        result.push(value);
    return result;
};
```

This is stringified as:

```javascript
(function(v0){return [v0,v0,v0,v0,v0,v0,v0,v0,v0,v0]})
```

But when you want to use primitives on variables, you have to explicitly demand them as arguments:

```JavaScript
LJSON = require("./ljson.js");

// Creates a function that computes the Bhaskara formula, given a set of
// mathematical primitives (negation, adition, subtraction and square roots).
function makeBhaskara(neg,add,sub,mul,div,sqrt){
    return function bhaskara(a,b,c){
        var delta = sqrt(sub(mul(b,b),mul(mul(4,a),c))); // sqrt(b*b - 4*a*c)
        var two_a = mul(2,a);
        var roots = [
            div(add(neg(b),delta),mul(2,a)),
            div(sub(neg(b),delta),mul(2,a))];
        return roots;
    };
};
```

This is stringified as:

```javascript
(function(v0,v1,v2,v3,v4,v5){return (function(v6,v7,v8){return [v4((v1((v0((v7)),v5((v2((v3((v7,v7)),v3((v3((4,v6)),v8)))))))),v3((2,v6)))),v4((v2((v0((v7)),v5((v2((v3((v7,v7)),v3((v3((4,v6)),v8)))))))),v3((2,v6))))]})})
```

And can be used as:

```javascript
// Creates the `bhaskara` function by giving the primitives it needs:
var bhaskara = makeBhaskara(
    function neg(x)  {return -x},
    function add(x,y){return x+y},
    function sub(x,y){return x-y},
    function mul(x,y){return x*y},
    function div(x,y){return x/y},
    function sqrt(x) {return Math.sqrt(x)});

// Finds the roots of the `x^2 + 2*x - 9` parabola:
console.log(bhaskara(1,2,-9));

// output: [ 2.1622776601683795, -4.16227766016838 ]
// As expected according to http://www.wolframalpha.com/input/?i=x%5E2+%2B+2*x+-+9+%3D+0
```

## Safety

The fact you have to explicitly provide primitives to LJSON functions is what gives you confidence they won't do any nasty thing such as stealing your password, mining bitcoins or launching missiles. LJSON functions can only do what you give them power to. You are still able to serialize side-effective functions, but the side effects will happen on the act of the serialization and stripped from the serialized output.

```JavaScript
function nastyPair(a,b){
    console.log("booom");
    return { 
        fst : a, 
        snd : (function nastyId(x){
            for (var i=0; i<3; ++i)
                console.log("mwahahhahha");
            return x;
        })(b)};
};

// output: 
// booom
// mwahahhahha
// mwahahhahha
// mwahahhahha
// (function(v0,v1){return {fst:v0,snd:v1})
```

## TODO

This is just an open idea and not really a featured implementation. Currently, it doesn't include a proper parser. There is `LJSON.unsafeParse`, which works the same for safe programs, but it uses `eval` so you shouldn't use it on untrusted code.

Moreover, there is no protection against non-terminating programs. Maybe a type system could be used?

And, of course, a precise specification. The informal specification can be stated as the JSON extended with functions operationally equivalent to the λ-calculus, except for allowing multiple arguments on abstractions and calls.
