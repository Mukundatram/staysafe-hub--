const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) {
    console.error("Usage: node autofix.js <file_path>");
    process.exit(1);
}

let pass = false;
for (let i = 0; i < 50; i++) {
    try {
        cp.execSync(`node -c ${file}`, { stdio: 'pipe' });
        console.log(`Syntax for ${file} is perfectly fixed!`);
        pass = true;
        break;
    } catch (e) {
        const err = e.stderr.toString();
        const match = err.match(new RegExp(`${path.basename(file)}:(\\d+)`));
        if (match) {
            const lineNum = parseInt(match[1], 10);
            let lines = fs.readFileSync(file, 'utf8').split('\n');
            const lineContent = lines[lineNum - 1];

            if (lineContent.includes(');')) {
                console.log(`Fixing unexpected ); at line ${lineNum}`);
                lines[lineNum - 1] = lineContent.replace(');', '');
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
