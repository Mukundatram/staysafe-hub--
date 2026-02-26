const fs = require('fs');
const path = require('path');

const controllerFile = path.join(__dirname, 'src', 'controllers', 'bookingController.js');
let code = fs.readFileSync(controllerFile, 'utf8');

// The functions end with `  }\n);` or `}\n);` instead of `};`
// Let's replace any `\n  }\n);` or similar with `\n};`
code = code.replace(/\n\s*\}\n\s*\);/g, '\n};');

fs.writeFileSync(controllerFile, code);
console.log('Fixed trailing parens in bookingController.js');
