const fs = require('fs');
let text = fs.readFileSync('refactor_log.txt', 'utf16le');
fs.writeFileSync('refactor_log_utf8.txt', text, 'utf8');
