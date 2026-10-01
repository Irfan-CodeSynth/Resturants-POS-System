// Bundles scripts/integration.test.ts (which imports the real src/main code) and runs it
// under node --test. esbuild is already here as a Vite dependency, so this adds none.
import { build } from 'esbuild'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outfile = path.join(root, 'out', 'test', 'integration.test.mjs')

fs.mkdirSync(path.dirname(outfile), { recursive: true })

await build({
  entryPoints: [path.join(root, 'scripts', 'integration.test.ts')],
  outfile,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  sourcemap: 'inline',
  // Native/wasm and other node deps must stay in place; only app code is bundled.
  external: ['sql.js', 'bcryptjs', 'uuid', 'date-fns'],
  alias: { electron: path.join(root, 'scripts', 'electron-stub.ts') },
  logLevel: 'warning'
})

const child = spawn(process.execPath, ['--test', '--test-reporter=spec', outfile], { stdio: 'inherit' })
child.on('exit', (code) => process.exit(code ?? 1))
