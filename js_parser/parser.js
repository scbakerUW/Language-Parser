Tokenizer = require('./tokenizer.js')
Hash = require("./hash.js");

var token_type = {
  start : /start/,
  finish : /finish/,
  number : /\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/
};

function Parser(str) {

  this.str = str; // the string to be parsed

  this.tokenizer = new Tokenizer();

  this.tokenizer
      .add(/\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/)
      .add(/\+/)
      .add(/-/)
      .add(/\*/)
      .add(/\//)
      .add(/%/)
      .add(/\(/)
      .add(/\)/)
      .add(/(\s)/)
      //.add(/(\r\n|\r|\n)/)
      .add(/\"(.*?)\"/) //grabs quoted string
      .add(/\[/)
      .add(/\]/)
      .add(/\{/)
      .add(/\}/)
      .add(/\:/)
      .add(/start/)
      .add(/end/)
      .add(/finish/)
      .add(/var/)
      .add(/[A-Za-z]+/) //grabs unquoted string and characters
      .add(/=/)
      .add(/,/)
      .add(/;/)
      .add(/print/);

  this.tokenizer.tokenize(str);
  this.paren_count = 0;
  this.last_pos = 0;

  this.varHash = new Hash();
}

Parser.prototype.factor = function() {
  var result;

  //accept(ident)
  //console.log("current: " + this.tokenizer.current());
  if(this.varHash.keyExists(this.tokenizer.current())) {
    var key = this.tokenizer.current();
    this.accept(/[A-Za-z]+/);
    //if ident is an array
    //console.log(this.varHash.get(key));
    if(this.accept(/\[/)) {
      var array = this.varHash.get(key);
      //console.log(this.tokenizer.current());
      result = array[this.tokenizer.current()];
      this.tokenizer.eat();
      this.expect(/\]/);
    }
    //else if ident is a hash
    else if(this.accept(/\{/)) {
      this.expect(/\}/);
    }
    //else ident is number or string
    else {
      var value = this.varHash.get(key);
      //console.log("value: " + typeof value);
      if (typeof(value) === 'number') {
        result = parseFloat(value);
      }
      else if (Array.isArray(value)){
        result = value;
      }
      else if (typeof(value) === 'string'){
        result = value.replace(/\"/g, "");
      }
      // if (value.match(/\"(.*?)\"/))
      //   result = this.varHash.get(key).replace(/\"/g, "");
      // else
      //   result = parseFloat(this.varHash.get(key));
    }
    //console.log("result factor " + result);
  }
  //accept string
  else if (this.accept(/\"(.*?)\"/)) {
    result = this.tokenizer.previous_token.replace(/\"/g, "");
  }
  //accept number
  else if(this.tokenizer.current().match(/\d+(\.\d+)?/)) {
    result = this.tokenizer.float_val();
    this.tokenizer.eat();
  }
  //accept (
  else if (this.tokenizer.current().match(/^\($/)) {
    this.last_pos = this.tokenizer.tok_pos;
    this.paren_count++;
    this.tokenizer.eat();
//    console.log("( encountered " + this.paren_count);
    while(!this.tokenizer.current().match(/^\)$/)) {
//      console.log("P");
      if(this.tokenizer.eof()) {
        var str = "factor: syntax error missing closing ')'";
        throw new ParserException(str.toString(),this.tokenizer.line_number, this.tokenizer.tok_pos);
      }
      else {
        //console.log("I'm going in...");
        result = this.expr();
//        console.log("last_pos=" + this.last_pos + ":tok_pos=" + this.tokenizer.tok_pos);
        if(this.last_pos == this.tokenizer.tok_pos && this.paren_count != 0) {
          var str = "factor: syntax error missing closing ')'";
          throw new ParserException(str.toString(),this.tokenizer.line_number, this.tokenizer.tok_pos);
        }
        if(this.last_pos != this.tokenizer.tok_pos) {
          this.paren_count--;
          this.last_pos = this.tokenizer.tok_pos;
        }
//        console.log("I'm out!");
//        console.log(this.tokenizer.tok_pos + ":" + this.tokenizer.eof());
      }
    }
//    console.log(") encountered " + this.paren_count);

    this.tokenizer.eat();
//    console.log("eat()... " + this.tokenizer.tok_pos + this.tokenizer.eof());
  }
  else {
    var str = "factor: syntax error '" + this.tokenizer.current_token + "' unexpected";
    throw new ParserException(str.toString(),this.tokenizer.line_number, this.tokenizer.tok_pos);
  }
  return result;
}

Parser.prototype.term = function() {
  var result;
  result = this.factor();
  //console.log("factor result = " + result);
  while(this.tokenizer.current().match(/^\*$/) || this.tokenizer.current().match(/^\/$/) ||
        this.tokenizer.current().match(/^\%$/)) {
    if(this.tokenizer.current().match(/^\*$/)) {
      this.tokenizer.eat();
      sub = this.factor();
//      console.log("*sub factor result = " + sub);
      result *= sub;
    }
    else if(this.tokenizer.current().match(/^\/$/)) {
      this.tokenizer.eat();
      sub = this.factor();
//      console.log("/sub factor result = " + sub);
      if(sub != 0) {
        result /= sub;
      }
      else {
        var str = "term: divisor error cannot divide by zero";
        throw new ParserException(str.toString(),this.tokenizer.line_number, this.tokenizer.tok_pos);
      }
    }
    else if(this.tokenizer.current().match(/^\%$/)) {
      this.tokenizer.eat();
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

  //console.log(this.tokenizer.current());
  // if(this.accept(/\"(.*?)\"/)) {
  //   return this.tokenizer.previous_token.replace(/\"/g,"");
  // }
  if (this.accept(/^-$/)) {
    //console.log("match - " + this.tokenizer.current());
    sign = -1;
  }
  else if (this.accept(/^\+$/)) {
    sign = 1;
  }
  if(typeof((term = this.term())) === 'number') {
    result = term * sign;
  }
  else {
    result = term;
  }
  //console.log("term result = " + result);
    while(this.tokenizer.current().match(/^\+$/) || this.tokenizer.current().match(/^-$/)) {
      if(this.tokenizer.current().match(/^\+$/)) {
        this.tokenizer.eat();
        //console.log(this.tokenizer.current());
        term = this.term();
        //console.log("typeof term: " + typeof(term));
        result += term;
      }
      else if(this.tokenizer.current().match(/^-$/)) {
        this.tokenizer.eat();
        //console.log(this.tokenizer.current());
        if(this.tokenizer.current().match(/^-$/)) {
          this.tokenizer.eat();
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
  //console.log("term result = " + result);
  return result;
}

Parser.prototype.statement = function() {
  var key;
  var printStr;
  //console.log("statement...");
  //console.log(this.tokenizer.current());

  if (this.accept(/print/)) {
    //console.log(this.tokenizer.tok_pos);
    this.print(this.expr());
    this.expect(/;/);
  }
  //if ident
  else if(this.varHash.keyExists(this.tokenizer.current())) {
    this.accept(/[A-Za-z]+/);
    key = this.tokenizer.previous_token;
    if(this.accept(/=/)) {
      if(this.accept(/\[/)) {
        var array = [];
        do {
          array.push(this.expr());
          //console.log(array);
        } while(this.accept(/,/));
        this.expect(/\]/);
        var result = array;
      }
      else if(this.accept(/\{/)) {
        var newkey = this.expr();
        this.expect(/\:/);
        var value = this.expr();
        var newHash = {newkey:value};
        this.varHash.set(key,newHash);
      }
      else {
        var result = this.expr();
      }
      //console.log(key + " = " + result);
      this.varHash.set(key, result);
      this.expect(/;/);
    }
  }
  //console.log(this.varHash.get());
}

Parser.prototype.block = function() {
  if (this.accept(/var/)) {
    //console.log("var accepted");
    do {
      this.expect(/[A-Za-z]+/);
      key = this.tokenizer.previous_token;
      //console.log("ident = " + key);
      this.varHash.set(key,0);
    } while (this.accept(/,/));
    this.expect(/;/);
  }
  this.statement();
}


Parser.prototype.program = function() {
  var program;
  if (this.accept(token_type.start)) {
    console.log("start program...");
    do {
      program = this.block();
    } while (!this.accept(token_type.finish));
    console.log("finished!");
    return program;
  }
}

Parser.prototype.accept = function(regstr) {
  if(this.tokenizer.current().match(regstr)) {
    this.tokenizer.eat();
    return true;
  }
  return false;
}

Parser.prototype.expect = function(regstr) {
  if(this.accept(regstr)) {
    return true;
  }
  var str = "expect: " + regstr + " unexpected: " + this.tokenizer.current();
  throw new ParserException(str.toString(),this.tokenizer.line_number, this.tokenizer.tok_pos);
  return false;
}

Parser.prototype.print = function(message) {
  console.log(message);
}

Parser.prototype.parse = function() {
  console.log(this.tokenizer.tokens);

  return this.program();
}

function ParserException(message, line_number, char_position) {
  this.message = '\x1b[1;31m' + message + ' at line number: ' + line_number + '\x1b[0;39m';// + ' character position: ' + char_position + '\x1b[0;39m';
  this.name = "ParserException";
}

module.exports = Parser;
