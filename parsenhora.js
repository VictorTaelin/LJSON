function parsenhora(parser){
    return function(str){
        var index = 0;
        function get(){
            return index !== str.length ? str[index++] : null;
        };
        function chr(c){
            return function(){
                return str[index] === c ? str[index++] : null;
            };
        };
        function isDigit(chr){
            var ASCII = chr.charCodeAt(0);
            return ASCII >= 48 && ASCII <= 57; // 0-9
        };
        function isHex(chr){
            var ASCII = chr.charCodeAt(0);
            return isDigit(chr) 
                || ASCII >= 65 && ASCII <= 70   // A-Z
                || ASCII >= 97 && ASCII <= 102; // a-z
        };
        function satisfy(test){
            return function(){
                return index !== str.length && test(str[index]) ? str[index++] : null;
            };
        };
        function digit(){
            return satisfy(isDigit)();
        };
        function hex(){
            return satisfy(isHex)();
        };
        function string(s){
            return function(){
                for (var i=0, l=s.length; i<l; ++i)
                    if (str[index+i] !== s[i])
                        return null;
                index += l;
                return s;
            };
        };
        function word(){
            function isWordChar(c){
                var ASCII = c.charCodeAt(0);
                return ASCII === 36                // $
                    || ASCII === 95                // _
                    || ASCII >= 97 && ASCII <= 122 // a-z
                    || ASCII >= 65 && ASCII <= 90  // A-Z
                    || ASCII >= 48 && ASCII <= 57; // 0-9
            };
            function wordChar(){
                return satisfy(isWordChar)();
            };
            function wordCharExceptDigits(){
                return satisfy(function(c){
                    return isWordChar(c) && !isDigit(c);
                })();
            };
            var head = wordCharExceptDigits();
            if (head === null)
                return null;
            var tail = many(wordChar)();
            if (tail === null)
                return null;
            return [head].concat(tail).join("");
        };
        function choice(options){
            return function(){
                for (var i=0, l=options.length; i<l; ++i){
                    var result = options[i]();
                    if (result !== null)
                        return result;
                };
                return null;
            };
        };
        function many(parse){
            return function(){
                var results = [];
                for (var result = parse(); result !== null; result = parse())
                    results.push(result);
                return results;
            };
        };
        function sequence(parsers){
            return function(){
                var results = [];
                for (var i=0, l=parsers.length; i<l; ++i){
                    var result = parsers[i]();
                    if (result === null)
                        return null;
                    results.push(result);
                };
                return results;
            };
        };
        function between(open,parse,close){
            return function(){
                var results = sequence([open, parse, close])();
                if (results === null)
                    return null;
                return results[1];
            };
        };
        function intercalated(parse,separator){
            return function(){
                var results = [];
                for (var result = parse(); result !== null; result = parse()){
                    results.push(result);
                    if (separator() === null)
                        return results;
                };
                return results;
            };
        };
        function pair(first,separator,second){
            return function(){
                var result = sequence([first,separator,second])();
                if (result === null)
                    return null;
                return [result[0], result[2]];
            };
        };
        function maybe(parse){
            return function(){
                var result = parse();
                if (result === null)
                    return [];
                return result;
            };
        };
        function skipSpaces(){
            while (str[index] === " ")
                ++index;
        };
        function intercalatedSpaced(parse,separator){
            return intercalated(parse,sequence([skipSpaces, separator, skipSpaces]));
        };
        function betweenSpaced(open,parse,close){
            return between(
                sequence([open,skipSpaces]),
                parse,
                sequence([skipSpaces,close]));
        };
        function pairSpaced(first,separator,second){
            return pair(
                first,
                sequence([
                    skipSpaces, 
                    separator, 
                    skipSpaces]),
                second);
        };
        return parser({
            get                : get,
            chr                : chr,
            isDigit            : isDigit,
            isHex              : isHex,
            satisfy            : satisfy,
            digit              : digit,
            hex                : hex,
            string             : string,
            word               : word,
            choice             : choice,
            many               : many,
            sequence           : sequence,
            between            : between,
            intercalated       : intercalated,
            pair               : pair,
            maybe              : maybe,
            skipSpaces         : skipSpaces,
            intercalatedSpaced : intercalatedSpaced,
            betweenSpaced      : betweenSpaced,
            pairSpaced         : pairSpaced})();
    }
};
module.exports = parsenhora;
