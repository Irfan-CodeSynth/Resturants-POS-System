const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'out' && f !== 'dist') {
        walk(full);
      }
    } else if (full.endsWith('.ts') || full.endsWith('.tsx')) {
      let content = fs.readFileSync(full, 'utf8');
      let changed = false;
      if (content.includes('\\`')) {
        content = content.split('\\`').join('`');
        changed = true;
      }
      if (content.includes('\\${')) {
        content = content.split('\\${').join('${');
        changed = true;
      }
      if (changed) {
        fs.writeFileSync(full, content, 'utf8');
        console.log('Fixed:', full);
      }
    }
  }
}

walk(path.join(__dirname, '..', 'src'));
console.log('Fix script completed.');
