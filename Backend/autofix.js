const cp = require('child_process');
const fs = require('fs');

const file = 'src/controllers/bookingController.js';

let pass = false;
for (let i = 0; i < 30; i++) {
    try {
        cp.execSync(`node -c ${file}`, { stdio: 'pipe' });
        console.log('Syntax is perfectly fixed!');
        pass = true;
        break;
    } catch (e) {
        const err = e.stderr.toString();
        const match = err.match(/bookingController\.js:(\d+)/);
        if (match) {
            const lineNum = parseInt(match[1], 10);
            let lines = fs.readFileSync(file, 'utf8').split('\n');
            const lineContent = lines[lineNum - 1];

            if (/^\s*\);\s*$/.test(lineContent)) {
                console.log('Fixing unexpected ); at line', lineNum);
                lines[lineNum - 1] = ''; // Blank the line out
                fs.writeFileSync(file, lines.join('\n'));
            } else {
                console.log(`Error at line ${lineNum}, content: "${lineContent}" - format not recognized. Aborting.`);
                console.log(err);
                break;
            }
        } else {
            console.log('No line match in error output. Error:', err);
            break;
        }
    }
}

if (pass) {
    process.exit(0);
} else {
    process.exit(1);
}
