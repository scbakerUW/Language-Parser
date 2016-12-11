//
// Usage:
//   node test_parser.js "1.0 + 5.4/2"
//

Parser = require('./parser.js')
fs = require('fs');
var content = fs.readFileSync(process.argv[2], 'ascii');
p = new Parser(content);
console.log('\x1b[1;32m[ ' + content + " ] evaluates to " + p.parse() + '\x1b[0;39m');
