import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { runtimeLocation } from '../docs/.vitepress/theme/utils/containerRuntime.mjs'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const component = read('docs/.vitepress/theme/components/BrowserContainerWorkbench.vue')
assert(component.includes('VITE_WASM_RUNTIME_BASE') && component.includes('https://wasm.2401.xyz/runtime'))
assert(!component.includes('build-c2w-runtime') && !component.includes('runtime/${getRuntimeId()}'))
for (const [id, page] of [['c2w', 'c2w-alpine'], ['c2w-shell', 'c2w-shell'], ['c2w-powershell', 'c2w-powershell']]) {
  assert(read(`docs/playground/${page}.md`).includes(`runtimeId="${id}"`))
  const legacy = path.join(root, `docs/public/runtime/${id}`)
  if (fs.existsSync(legacy)) assert(!fs.readdirSync(legacy).some(name => name.endsWith('.gz') || ['manifest.json', 'Dockerfile'].includes(name)), 'Legacy heavy assets remain')
  assert(runtimeLocation(id).assetBase.startsWith('https://wasm.2401.xyz/runtime/shell/'))
}
for (const file of ['.github/workflows/build-c2w-runtime.yml', 'build_local.sh', 'scripts/package-c2w.js']) assert(!fs.existsSync(path.join(root, file)), `Legacy build entry remains: ${file}`)
for (const file of ['worker.js', 'wasi-util.js', 'xterm-pty.js']) assert(fs.existsSync(path.join(root, 'docs/public/runtime/c2w/engine', file)))
assert(!read('docs/public/_headers').includes('Content-Encoding: gzip'))
console.log('Hello Shell shared container runtime configuration passed: 3 routes, explicit architectures, no local heavy assets/build entries.')
