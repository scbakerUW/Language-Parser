Tokenizer = require('./tokenizer.js')
Hash = require("./hash.js");



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
      .add(/(\s+)/)
      .add(/start/)
      .add(/end/)
      .add(/finish/)
      .add(/var/)
      .add(/[A-Za-z]+/)
      .add(/=/)
      .add(/;/)
      .add(/print/);

  this.tokenizer.tokenize(str);
  this.paren_count = 0;
  this.last_pos = 0;

  this.varHash = new Hash();
}

Parser.prototype.factor = function() {
  var result;

  if(this.tokenizer.current().match(/\d+(\.\d+)?/)) {
    result = this.tokenizer.float_val();
    //console.log("result factor " + result);
    this.tokenizer.eat();
  }
  else if (this.tokenizer.current().match(/^\($/)) {
    this.last_pos = this.tokenizer.tok_pos;
    this.paren_count++;
    this.tokenizer.eat();
//    console.log("( encountered " + this.paren_count);
    while(!this.tokenizer.current().match(/^\)$/)) {
//      console.log("P");
      if(this.tokenizer.eof()) {
        var str = "factor: syntax error missing closing ')'";
        throw new ParserException(str.toString(),this.tokenizer.tok_pos);
      }
      else {
//        console.log("I'm going in...");
        result = this.expr();
//        console.log("last_pos=" + this.last_pos + ":tok_pos=" + this.tokenizer.tok_pos);
        if(this.last_pos == this.tokenizer.tok_pos && this.paren_count != 0) {
          var str = "factor: syntax error missing closing ')'";
          throw new ParserException(str.toString(),this.tokenizer.tok_pos);
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
    throw new ParserException(str.toString(),this.tokenizer.tok_pos);
  }
  return result;
}

Parser.prototype.term = function() {
  var result;
  result = this.factor();
//  console.log("factor result = " + result);
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
        throw new ParserException(str.toString(),this.tokenizer.tok_pos);
      }
    }
    else if(this.tokenizer.current().match(/^\%$/)) {
      this.tokenizer.eat();
      sub = this.factor();
      result %= sub;
    }
    else {
      var str = "term: syntax error '" + this.tokenizer.current_token + "' unexpected";
      throw new ParserException(str.toString(),this.tokenizer.tok_pos);
    }
  }
  return result;
}

Parser.prototype.expr = function() {
  var sign = 1;
  var result;

  //console.log(this.tokenizer.current());
  if (this.tokenizer.current().match(/^-$/)) {
    //console.log("match - " + this.tokenizer.current());
    this.tokenizer.eat();
    sign = -1;
  }
  else if (this.tokenizer.current().match(/^\+$/)) {
    this.tokenizer.eat();
    sign = 1;
  }
  result = this.term() * sign;
//console.log("term result = " + result);
  while(this.tokenizer.current().match(/^\+$/) || this.tokenizer.current().match(/^-$/)) {
    if(this.tokenizer.current().match(/^\+$/)) {
      this.tokenizer.eat();
      //console.log(this.tokenizer.current());
      result += this.term();
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
      throw new ParserException(str.toString(),this.tokenizer.tok_pos);
    }
  }
  return result;
}

Parser.prototype.statement = function() {
  var key;
  var printStr;
  if( this.tokenizer.current().match(/start/)) {
    this.tokenizer.eat();
    while (!this.tokenizer.current().match(/finish/)) {
      if (this.tokenizer.current().match(/var/)) {
        this.tokenizer.eat();
        //expect identifier string
        if(this.tokenizer.current().match(/[A-Za-z]+/)) {
          key = this.tokenizer.current_token;
          console.log(key);
          this.tokenizer.eat();
          if(this.tokenizer.current().match(/=/)) {
            this.tokenizer.eat();
            var result = this.expr();
            //console.log(result);
            this.varHash.set(key, result);
          }
          else {
            var str = "expression: syntax error '" + this.tokenizer.current() + "' unexpected";
            throw new ParserException(str.toString(),this.tokenizer.tok_pos);
          }
        }
        else {
          var str = "expression: syntax error '" + this.tokenizer.current() + "' unexpected";
          throw new ParserException(str.toString(),this.tokenizer.tok_pos);
        }
      }
      if (this.tokenizer.current().match(/print/)) {
        this.tokenizer.eat();
        if(this.tokenizer.current().match(/\(/)) {
          this.tokenizer.eat();
          while(!this.tokenizer.current().match(/\)/)) {
            //console.log("current tok : " + this.tokenizer.current());
            var key = this.tokenizer.current_token;
            //console.log(key);
            this.print("result " + this.varHash.get(key));
            this.tokenizer.eat();
          }
        }
      }
      this.tokenizer.eat();
      //console.log(this.varHash.get());
    }
  }
}

Parser.prototype.print = function(message) {
  console.log(message);
}

Parser.prototype.parse = function() {
  console.log(this.tokenizer.tokens);

  return this.statement();
}

function ParserException(message, position) {
  this.position = position;
  this.message = '\x1b[1;31m' + message + ' at character position: ' + position + '\x1b[0;39m';
  this.name = "ParserException";
}

module.exports = Parser;
