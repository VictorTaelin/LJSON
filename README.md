## λJSON 

λJSON is a drop-in replacement for [JSON](http://www.json.org) which also allows you to parse and stringify pure functions and their contents. There are good security reasons for functions to be out of the JSON specs, but most of those are only significant when you allow arbitrary, side-effective programs. With pure functions, one is able to interchange code while still being as safe as with regular JSON.

```JavaScript
var LJSON = require("LJSON");

// `newPlayer` is a function and couldn't be serialized with JSON.
function newPlayer(name){
    return {
        name      : name,
        hp        : 12,
        atk       : 5,
        def       : 5,
        inventory : []}
};

// LJSON has no trouble doing it because `newPlayer` is pure.
var newPlayerSource = LJSON.stringify(newPlayer); 
var John            = LJSON.parse(newPlayerSource)("John");

console.log("Serialized λJSON: " + newPlayerSource);
console.log("Parsed and applied: " + John);
```

Output:

    Serialized λJSON: (function(v0){return {name:v0,hp:12,atk:5,def:5,inventory:[]}})
    Parsed and applied: { name: 'John', hp: 12, atk: 5, def: 5, inventory: [] }

## More info

- [Primitives](#primitives)
- [Safety](#safety)
- [Normal Form](#normal-form)
- [Use cases](#use-cases)
- [TODO](#todo)

## Primitives

LJSON adds pure functions to JSON and nothing else - no specific primitive is available. That means you can't use mathematical operators, for-loops, conditionals etc. at all on the functions, because those are not part of the spec. You can still use those when they can be removed before stringification:

```JavaScript
function repeat10Times(value){
    var result = [];
    for (var i=0; i<10; ++i)
        result.push(value);
    return result;
};
```

which is stringified as:

```javascript
(function(v0){return [v0,v0,v0,v0,v0,v0,v0,v0,v0,v0]})
```

But if you want to use primitives on variables, you have to explicitly demand them as arguments:

```JavaScript
LJSON = require("./ljson.js");

// Creates a function that computes the Bhaskara formula, 
// and depends on a set of mathematical primitives.
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

The fact you have to explicitly provide primitives to LJSON functions is what gives you confidence they won't do any nasty thing such as stealing your password, mining bitcoins or launching missiles. LJSON functions can only do what you give them power to. You are still able to serialize side-effective functions, but the side effects will happen on the act of the serialization and get stripped from the serialized output.

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

## Normal form

In the same way that JSON stringifies `3e2` as `300` - i.e., only the actual value, not the original source is preserved - λJSON stringifies functions using their [normal forms](https://en.wikipedia.org/wiki/Normal_form_(abstract_rewriting)). That is, for example:

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

## Use cases

There are countless applications to being able to store and interchange code safely. For example, if you are programming a card game, you could allow your players to create their own card effects. To do that safely, you just have ensure functions have only enough access to perform valid in-game moves - and you can do that by restricting the set of primitivies you give them. Similarly, the same technique could enable players of a MMO to send AI for their ingame bots without being able to also send code that multiplies their own items. And you could use LJSON to allow users of your bitcoin exchange to send their own trading strategies without fearing they'll use a JavaScript exploit to steal your private keys. There are countless uses. Of course, designing LJSON functions requires more patience than designing usual JavaScript functions - but it opens many doors nether less.

## TODO

#### Implement the safe parser

This is just an open idea and not really a featured implementation. Currently, it doesn't include a proper parser. There is `LJSON.unsafeParse`, which works the same for safe programs, but it uses `eval` so you shouldn't use it on untrusted code. Adding a safe parser shouldn't be a hard task as it is just a matter of adding functions and function application to the JSON's grammar - nasty things are excluded by the fact you can't use unbound variables. But I don't have the time right now - feel free to give it a try! I'll be coming to this problem later if nobody comes up with something.

#### Halting problem (or not really)

There is no protection against non-terminating programs on the general case. A type system could be used to ensure LJSON programs terminate. For example, system F would exclude 100% of the non-terminating programs, at the cost of also throwing away some that would terminate. Yet, I don't think that would be necessary since you can still play very safe with what we have. 

For example, if you enable only mathematical operators, conditionals and bounded loops as primitives - and if you call your LJSON functions with nothing but first-order values (strings, ints, arrays, etc., but not other functions), then you are safe to say you program will halt. The reason is that, without loop primitives, users can't express things like `while(true)` - and, and since LJSON functions are in normal forms (which is easy to verify mechanically), users can't send non-terminating lambda-calculus expressions such as `(λ x . x x) (λ x . x x)` (those don't have a normal form). That is already enough power to encode most, if not all, practical algorithms, while still being safe to say they won't freeze your server. 

#### Specification

And, of course, a precise specification. The informal specification can be stated as the JSON extended with functions operationally equivalent to the λ-calculus, except for allowing multiple arguments on abstractions and calls.
