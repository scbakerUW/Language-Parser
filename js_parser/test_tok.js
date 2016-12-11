Tokenizer = require('./tokenizer.js')
t = new Tokenizer(process.argv[2])
console.log('\x1b[1;32m[ ' + process.argv[2] + " ] evaluates to " + t.tokenize() + '\x1b[0;39m');
