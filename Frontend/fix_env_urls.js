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

const target1 = "process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:4000'";
const replacement1 = "process.env.REACT_APP_API_BASE_URL ? process.env.REACT_APP_API_BASE_URL.replace('/api', '') : (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:4000')";

const target2 = "baseURL: process.env.REACT_APP_API_URL || '/api',";
const replacement2 = "baseURL: process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || '/api',";

const target3 = "const backendUrl = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : '/';";
const replacement3 = "const backendUrl = process.env.REACT_APP_API_BASE_URL ? process.env.REACT_APP_API_BASE_URL.replace('/api', '') : (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : '/');";

// Escape regex helpers
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    if (content.includes(target1)) {
        content = content.replace(new RegExp(escapeRegExp(target1), 'g'), replacement1);
        changed = true;
    }

    if (content.includes(target2)) {
        content = content.replace(new RegExp(escapeRegExp(target2), 'g'), replacement2);
        changed = true;
    }

    if (content.includes(target3)) {
        content = content.replace(new RegExp(escapeRegExp(target3), 'g'), replacement3);
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        replacedCount++;
        console.log(`Updated: ${file}`);
    }
});

console.log(`\nFixed total of ${replacedCount} files.`);
