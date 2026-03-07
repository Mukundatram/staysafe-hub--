const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
let replacedCount = 0;

// The exact string that prepends the base URL
const envBlock = "process.env.REACT_APP_API_BASE_URL ? process.env.REACT_APP_API_BASE_URL.replace('/api', '') : (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:4000')";

// Find cases where it prepends to a variable: `${envBlock}${variable}`
const regex1 = new RegExp(`\\$\\{${envBlock.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\$\\{([^}]+)\\}`, 'g');

// Replace it with conditional check: `${variable.startsWith('http') ? variable : `${envBlock}${variable}`}`
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    const newContent = content.replace(regex1, (match, variable) => {
        changed = true;
        // Special inline conditional checking if the variable starts with 'http'
        return `\${${variable}?.startsWith('http') ? '' : (${envBlock})}\${${variable}}`;
    });

    // Second pass for map arrays, e.g. .map(img => `${envBlock}${img}`)
    const regex2 = new RegExp(`img => \`\\$\\{${envBlock.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\$\\{img\\}\``, 'g');
    const finalContent = newContent.replace(regex2, (match) => {
        changed = true;
        return `img => img.startsWith('http') ? img : \`\${${envBlock}}\${img}\``;
    });

    if (changed) {
        fs.writeFileSync(file, finalContent);
        replacedCount++;
        console.log(`Updated: ${file}`);
    }
});

console.log(`\nFixed total of ${replacedCount} files.`);
