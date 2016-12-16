/* parser.js
 * This is the main parser/interpreter for the language.
 * This uses the concept of recursive descent parsing.
 */

Tokenizer = require('./tokenizer.js')
Hash = require("./hash.js");

//Create token type objects to use in the tokenizer and parser
var TOKEN_TYPES = {
  STARTPROG : (/start/),
  FINISHPROG : (/finish/),
  COMMENT: (/\/\*.*\*\//),
  NUMBER : (/\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/),
  PLUS : (/\+/),
  MINUS : (/\-/),
  TIMES : (/\*/),
  SLASH : (/\//),
  MOD : (/%/),
  LPAREN : (/\(/),
  RPAREN : (/\)/),
  WHITESPACE : (/(\s)/),
  QUOTED : (/"((?:\\.|[^"\\])*)"/), //grabs quoted string
  LBRACKET : (/\[/),
  RBRACKET : (/\]/),
  LCURLY : (/\{/),
  RCURLY : (/\}/),
  COLON : (/\:/),
  PERIOD : (/\./),
  VARSYM : (/var/),
  IDENT : (/[A-Za-z0-9]+/), //grabs unquoted string and characters
  EQUALS : (/=/),
  COMMA : (/,/),
  SEMICOLON : (/;/),
  PRINT : (/print/),
  IFSYM : (/if/),
  THENSYM : (/then/),
  ENDSYM : (/end/),
  CONDNEQL : (/!=/),
  CONDLST : (/</),
  CONDGRT : (/>/),
  CONDLSE : (/<=/),
  CONDGRE : (/>=/),
  DO : (/do/),  //future functionality (not currently implemented)
  WHILE : (/while/), //future functionality (not currently implemented)
  FUNC : (/func/), //future functionality (not currently implemented)
};

function Parser(str) {

  this.str = str; // the string to be parsed

  this.tokenizer = new Tokenizer();

  // add all tokens to the tokenizer regex
  for (var key in TOKEN_TYPES) {
    this.tokenizer.add(TOKEN_TYPES[key]);
  }

  // tokenize the input str (code file)
  this.tokenizer.tokenize(str);
  this.paren_count = 0;
  this.last_pos = 0;

  //create the hash object to store the variables
  this.varHash = new Hash();
}

Parser.prototype.factor = function() {
  var result;
  //console.log("c = " + this.tokenizer.current() + " " + this.tokenizer.tok_pos);
  //accept(ident)
  if(this.varHash.keyExists(this.tokenizer.current())) {
    var key = this.tokenizer.current();
    this.accept(TOKEN_TYPES.IDENT);
    //if ident is an array
    if(this.accept(TOKEN_TYPES.LBRACKET)) {
      var array = this.varHash.get(key);
      result = array[this.tokenizer.current()];
      this.tokenizer.eat();
      this.expect(TOKEN_TYPES.RBRACKET);
    }
    //else if ident is a hash
    else if(this.accept(TOKEN_TYPES.PERIOD)) {
      var subkey = this.tokenizer.current();
      this.tokenizer.eat();
      if(this.varHash.get(key).hasOwnProperty(subkey)) {
        result = this.varHash.get(key)[subkey];
      } else {
        result = null;
      }
    }
    //else ident is number, string, array, or hash
    else {
      var value = this.varHash.get(key);
      if (typeof(value) === 'number') {
        result = parseFloat(value);
      }
      else if (Array.isArray(value)){
        result = value;
      }
      else if (typeof(value) === 'string'){
        result = value.replace(/\"/g, "");
      }
      else if (typeof(value) === 'object'){
        result = value;
      }
      else {
        return null;
      }
    }
  }
  //accept QUOTED STRING
  else if (this.accept(TOKEN_TYPES.QUOTED)) {
    result = this.tokenizer.previous_token.replace(/\"/g, "");
  }
  //accept NUMBER
  else if(this.accept(TOKEN_TYPES.NUMBER)) {
    result = parseFloat(this.tokenizer.previous_token);
  }
  //accept LPAREN
  else if (this.accept(TOKEN_TYPES.LPAREN)) {
    this.last_pos = this.tokenizer.tok_pos;
    this.paren_count++;
    //console.log("paren_count=" + this.paren_count);
    do {
      if(this.tokenizer.eof()) {
        var str = "factor: syntax error missing closing ')'";
        throw new ParserException(str.toString(),this.tokenizer.line_number, this.tokenizer.tok_pos);
      }
      else {
        result = this.expr();
        //console.log("r " + result);
        if(this.last_pos == this.tokenizer.tok_pos && this.paren_count != 0) {
          var str = "factor: syntax error missing closing ')'";
          throw new ParserException(str.toString(),this.tokenizer.line_number, this.tokenizer.tok_pos);
        }
        if(this.last_pos != this.tokenizer.tok_pos) {
          this.paren_count--;
          this.last_pos = this.tokenizer.tok_pos;
        }
      }
    } while(!this.accept(TOKEN_TYPES.RPAREN));
  }
  else {
    var str = "factor: syntax error '" + this.tokenizer.current_token + "' unexpected";
    throw new ParserException(str.toString(),this.tokenizer.line_number, this.tokenizer.tok_pos);
  }
  return result;
}

Parser.prototype.term = function() {
  var result;
  //console.log("term: " + this.tokenizer.current());
  result = this.factor();
  while(this.tokenizer.current().match(TOKEN_TYPES.TIMES) || this.tokenizer.current().match(TOKEN_TYPES.SLASH) ||
        this.tokenizer.current().match(TOKEN_TYPES.MOD)) {
    if(this.accept(TOKEN_TYPES.TIMES)) {
      sub = this.factor();
      result *= sub;
    }
    else if(this.accept(TOKEN_TYPES.SLASH)) {
      sub = this.factor();
      if(sub != 0) {
        result /= sub;
      }
      else {
        var str = "term: divisor error cannot divide by zero";
        throw new ParserException(str.toString(),this.tokenizer.line_number, this.tokenizer.tok_pos);
      }
    }
    else if(this.accept(TOKEN_TYPES.MOD)) {
      sub = this.factor();
      result %= sub;
    }
    else {
      var str = "term: syntax error '" + this.tokenizer.current_token + "' unexpected";
      throw new ParserException(str.toString(),this.tokenizer.line_number, this.tokenizer.tok_pos);
    }
  }
  return result;
}

Parser.prototype.expr = function() {
  var sign = 1;
  var result, term;

  //console.log("expr: " + this.tokenizer.current());
  if (this.accept(/^\-$/)) {
    sign = -1;
    //console.log("minus");
  }
  else if (this.accept(/^\+$/)) {
    sign = 1;
  }
  // if result from term() is a number, apply sign
  if(typeof((term = this.term())) === 'number') {
    result = term * sign;
  }
  // else if not a number (string)
  else {
    result = term;
  }
  //console.log("re " + result);
    while(this.tokenizer.current().match(/^\+$/) || this.tokenizer.current().match(/^\-$/)) {
      if(this.accept(/^\+$/)) {
        term = this.term();
        result += term;
      }
      else if(this.accept(/^\-$/)) {
        if(this.accept(/^\-$/)) {
          result += this.term();
        }
        else {
          result -= this.term();
        }
      }
      else {
        var str = "expression: syntax error '" + this.tokenizer.current() + "' unexpected";
        throw new ParserException(str.toString(),this.tokenizer.line_number, this.tokenizer.tok_pos);
      }
    }
  return result;
}

Parser.prototype.condition = function() {
  var left = this.expr();
  // ==
  if (this.accept(TOKEN_TYPES.EQUALS)) {
    if(this.expect(TOKEN_TYPES.EQUALS)) {
      return (left == this.expr());
    }
  }
  // !=
  else if (this.accept(TOKEN_TYPES.CONDNEQL)) {
    return (left != this.expr());
  }
  // <
  else if (this.accept(TOKEN_TYPES.CONDLST)) {
    return (left < this.expr());
  }
  // >
  else if (this.accept(TOKEN_TYPES.CONDGRT)) {
    return (left > this.expr());
  }
  // <=
  else if (this.accept(TOKEN_TYPES.CONDLSE)) {
    return (left <= this.expr());
  }
  // >=
  else if (this.accept(TOKEN_TYPES.CONDGRE)) {
    return (left >= this.expr());
  }
  else {
    //error
    var str = "condition: syntax error '" + this.tokenizer.current() + "' unexpected";
    throw new ParserException(str.toString(),this.tokenizer.line_number, this.tokenizer.tok_pos);
  }
}

Parser.prototype.statement = function() {
  var key;
  var printStr;

  //accept "print" keyword
  if (this.accept(TOKEN_TYPES.PRINT)) {
    this.print(this.expr());
    this.expect(TOKEN_TYPES.SEMICOLON);
  }
  //if ident
  else if(this.varHash.keyExists(this.tokenizer.current())) {
    this.accept(TOKEN_TYPES.IDENT);
    key = this.tokenizer.previous_token;
    if(this.accept(TOKEN_TYPES.EQUALS)) {
      // accept start of array assignment
      if(this.accept(TOKEN_TYPES.LBRACKET)) {
        var array = [];
        do {
          array.push(this.expr());
        } while(this.accept(TOKEN_TYPES.COMMA));
        this.expect(TOKEN_TYPES.RBRACKET);
        var result = array;
      }
      // else assignment is number or string
      else {
        var result = this.expr();
      }
      this.varHash.set(key, result);
      this.expect(TOKEN_TYPES.SEMICOLON);
    }
    //accept perion token
    else if(this.accept(TOKEN_TYPES.PERIOD)) {
      var newkey = this.tokenizer.current();
      this.tokenizer.eat();
      this.expect(TOKEN_TYPES.EQUALS);
      var value = this.expr();
      var newHash = new Hash();
      if(this.varHash.get(key) != 0){
        newHash.items = this.varHash.get(key);
      }
      newHash.set(newkey,value);
      this.varHash.set(key,newHash.items);
      this.expect(TOKEN_TYPES.SEMICOLON);
    }
  }
  //if statement
  else if(this.accept(TOKEN_TYPES.IFSYM)) {
    this.expect(TOKEN_TYPES.LPAREN);
    var result = this.condition();
    this.expect(TOKEN_TYPES.RPAREN);
    this.expect(TOKEN_TYPES.THENSYM);
    if(result) {
      this.statement();
      this.expect(TOKEN_TYPES.ENDSYM);
    }
    else {
      do {
        //if condition is the if statement is false,
        //eat tokens until the end token is seen
        this.tokenizer.eat();
      } while (!this.accept(TOKEN_TYPES.ENDSYM));
    }
  }
  //eat comment
  this.accept(TOKEN_TYPES.COMMENT);
}

Parser.prototype.block = function() {
  //accept var token
  if (this.accept(TOKEN_TYPES.VARSYM)) {
    do {
      //expects that a indentifer follows
      this.expect(TOKEN_TYPES.IDENT);
      key = this.tokenizer.previous_token;
      this.varHash.set(key,0);
      //accept commas for multiple declarations
    } while (this.accept(TOKEN_TYPES.COMMA));
    // at end of declarations, expect a semicolon
    this.expect(TOKEN_TYPES.SEMICOLON);
    //accept function constructor
    //**TODO : doesn't work yet (placeholder at the moment)
  } else if (this.accept(TOKEN_TYPES.FUNC)) {
    this.expect(TOKEN_TYPES.IDENT);
    key = this.tokenizer.previous_token;
    var funcHash = new Hash();
    this.varHash.set(key,0);
    this.expect(TOKEN_TYPES.SEMICOLON);
  }
  //eat comments (basically it ignores them)
  this.accept(TOKEN_TYPES.COMMENT);
  this.statement();
}


Parser.prototype.program = function() {
  var program;
  if (this.accept(TOKEN_TYPES.STARTPROG)) {
    //console.log("start program...");
    do {
      program = this.block();
    } while (!this.accept(TOKEN_TYPES.FINISHPROG));
    //console.log("finished!");
    return program;
  }
}

//returns true and eats the current token if the regstr is equal to the current token
Parser.prototype.accept = function(regstr) {
  if(this.tokenizer.current().match(regstr)) {
    this.tokenizer.eat();
    return true;
  }
  return false;
}

//returns true and eats the current token if regstr matches current token
//else returns false and error if unexpected token
Parser.prototype.expect = function(regstr) {
  if(this.accept(regstr)) {
    return true;
  }
  var str = "expect: " + regstr + " unexpected: " + this.tokenizer.current();
  throw new ParserException(str.toString(),this.tokenizer.line_number, this.tokenizer.tok_pos);
  return false;
}

//prints to screen
Parser.prototype.print = function(message) {
  console.log(message);
}

//main parse function
Parser.prototype.parse = function() {
  console.log(this.tokenizer.tokens);
  return this.program();
}

function ParserException(message, line_number, char_position) {
  this.message = '\x1b[1;31m' + message + ' at line number: ' + line_number + '\x1b[0;39m';// + ' character position: ' + char_position + '\x1b[0;39m';
  this.name = "ParserException";
}

module.exports = Parser;
