function Tokenizer(regexps) {

  this.re_string = "";
  this.re;
  this.tokens = [];
  this.current_token;
  this.tok_pos = 0;

  if ( regexps ) {
    for ( var i=0; i<regexps.length; i++ ) {
      this.add(regexps[i]);
    }
  }

}

Tokenizer.prototype.add = function(regexp) {
  if ( this.re_string == "" ) {
    this.re_string = regexp.source;
  } else {
    this.re_string += "|" + regexp.source;
  }
  this.re = RegExp(this.re_string,"g");
  return this;
}

Tokenizer.prototype.tokenize = function(str) {
  this.tokens = str.match(this.re);
  return this;
}

//Returns current token
Tokenizer.prototype.current = function() {
  if ( this.tok_pos == 0 ) {
    this.current_token = this.next();
  }
  return this.current_token;
}

Tokenizer.prototype.float_val = function() {
  // Possibly useful to return the current value as a float
  // or return NaN if it doesn't evaluate (using the built in
  // method parseFloat)
  return parseFloat(this.current());
}

Tokenizer.prototype.eat_whitespace = function() {
  while ( this.tok_pos < this.tokens.length && (this.tokens[this.tok_pos]).match(/(\s+)/) ) {
//    console.log("ws");
    this.tok_pos++;
  }
}


//Peeks at next token
Tokenizer.prototype.next = function() {

  // skip white space
  this.eat_whitespace();

  if ( this.eof() ) {
    throw new TokenizerException("Unexpected EOF");
  }
//  console.log("tok_pos" + this.tok_pos);
  return this.tokens[this.tok_pos++];

}

//Eats current token
Tokenizer.prototype.eat = function() {

  if ( !this.eof() ) {
    this.current_token = this.next();
  }
  return this.current_token;
}

Tokenizer.prototype.eof = function() {
  this.eat_whitespace();
  return this.tok_pos >= this.tokens.length;
}

function TokenizerException(message){
  this.message = '\x1b[1;31m' + message + '\x1b[0;39m';
  this.name = "TokenizerException";
}

module.exports = Tokenizer;
