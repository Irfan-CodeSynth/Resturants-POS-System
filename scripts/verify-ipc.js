const fs = require('fs');
const path = require('path');

// Load ipc-channels
const content = fs.readFileSync(path.join(__dirname, '..', 'src', 'shared', 'ipc-channels.ts'), 'utf8');
const matches = content.match(/[A-Z0-9_]+:\s*['"][^'"]+['"]/g) || [];
const validKeys = new Set(matches.map(m => m.split(':')[0].trim()));

console.log(`Found ${validKeys.size} valid IPC keys in ipc-channels.ts`);

// Scan all src/main/ipc/*.ipc.ts
const ipcDir = path.join(__dirname, '..', 'src', 'main', 'ipc');
const files = fs.readdirSync(ipcDir).filter(f => f.endsWith('.ipc.ts'));

let errorCount = 0;
for (const file of files) {
  const code = fs.readFileSync(path.join(ipcDir, file), 'utf8');
  const ipcUsages = code.match(/IPC\.([A-Z0-9_]+)/g) || [];
  for (const usage of ipcUsages) {
    const key = usage.replace('IPC.', '');
    if (!validKeys.has(key)) {
      console.error(`ERROR: Unknown key "${key}" in ${file}`);
      errorCount++;
    }
  }
}

if (errorCount === 0) {
  console.log('SUCCESS: All IPC keys in all ipc handlers are 100% valid and defined!');
} else {
  console.error(`Found ${errorCount} invalid IPC keys!`);
  process.exit(1);
}
