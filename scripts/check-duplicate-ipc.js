const fs = require('fs');
const path = require('path');

const ipcDir = path.join(__dirname, '..', 'src', 'main', 'ipc');
const files = fs.readdirSync(ipcDir).filter(f => f.endsWith('.ipc.ts'));

const handlers = new Map();
let duplicates = 0;

for (const file of files) {
  const code = fs.readFileSync(path.join(ipcDir, file), 'utf8');
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/ipcMain\.handle\(([^,]+),/);
    if (match) {
      const channel = match[1].trim();
      if (handlers.has(channel)) {
        console.error(`DUPLICATE HANDLER for ${channel}:`);
        console.error(`  1) ${handlers.get(channel)}`);
        console.error(`  2) ${file}:${i + 1}`);
        duplicates++;
      } else {
        handlers.set(channel, `${file}:${i + 1}`);
      }
    }
  }
}

if (duplicates === 0) {
  console.log(`SUCCESS: All ${handlers.size} IPC handlers across all files are unique! No collisions.`);
} else {
  console.error(`Found ${duplicates} duplicate IPC handlers!`);
  process.exit(1);
}
