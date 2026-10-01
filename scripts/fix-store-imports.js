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
      
      // Fix imports from '@/store/authStore' to '@/stores/auth-store'
      if (content.includes('@/store/authStore') || content.includes('@/stores/authStore')) {
        content = content.split('@/store/authStore').join('@/stores/auth-store');
        content = content.split('@/stores/authStore').join('@/stores/auth-store');
        changed = true;
      }
      if (content.includes('@/store/appStore') || content.includes('@/stores/appStore')) {
        content = content.split('@/store/appStore').join('@/stores/app-store');
        content = content.split('@/stores/appStore').join('@/stores/app-store');
        changed = true;
      }
      if (content.includes('@/store/posStore') || content.includes('@/stores/posStore')) {
        content = content.split('@/store/posStore').join('@/stores/pos-store');
        content = content.split('@/stores/posStore').join('@/stores/pos-store');
        changed = true;
      }
      if (content.includes("from '../store/")) {
        content = content.split("from '../store/").join("from '../stores/");
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(full, content, 'utf8');
        console.log('Fixed imports in:', full);
      }
    }
  }
}

walk(path.join(__dirname, '..', 'src', 'renderer'));
console.log('Done fixing store imports.');
