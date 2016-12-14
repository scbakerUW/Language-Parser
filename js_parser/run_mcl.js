//
// Usage:
//   node run_mcl.js [*.mcl file]
//

Parser = require('./parser.js')
fs = require('fs');
var content = fs.readFileSync(process.argv[2], 'ascii');
p = new Parser(content);
p.parse();
