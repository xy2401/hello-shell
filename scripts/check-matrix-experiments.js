import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const tasks = [
  { stem: '00_env', fixtures: [] },
  { stem: '01_hello_io', fixtures: [] },
  { stem: '02_variables_quoting', fixtures: [] },
  { stem: '03_args_parsing', fixtures: [] },
  { stem: '04_control_flow', fixtures: ['orders.csv', 'data/app.log', 'data/config.csv', 'data/readme.txt'] },
  { stem: '05_functions_scope', fixtures: [] },
  { stem: '06_pipes_files', fixtures: ['orders.csv', 'data/app.log', 'data/config.csv', 'data/readme.txt'] },
  { stem: '07_errors', fixtures: [] },
  { stem: '08_real_world', fixtures: ['data/app.log', 'data/config.csv', 'data/readme.txt'] },
]

const runtimes = [
  { directory: 'bash', extension: 'sh' },
  { directory: 'zsh', extension: 'zsh' },
  { directory: 'fish', extension: 'fish' },
  { directory: 'pwsh', extension: 'ps1' },
  { directory: 'python', extension: 'py' },
  { directory: 'cmd', extension: 'bat' },
  { directory: 'powershell5', extension: 'ps1' },
  { directory: 'powershell7', extension: 'ps1' },
]

const normalize = (value) => value.replace(/\r\n?/g, '\n')

function requireFile(relativePath) {
  const absolutePath = path.join(ROOT, relativePath)
  if (!fs.existsSync(absolutePath)) throw new Error(`Matrix 实验资源不存在：${relativePath}`)
  return fs.readFileSync(absolutePath, 'utf8')
}

function checkMatrixFiles() {
  let variants = 0
  for (const task of tasks) {
    for (const runtime of runtimes) {
      const source = `demos/${runtime.directory}/${task.stem}.${runtime.extension}`
      const snapshot = `${source}.out.txt`
      requireFile(source)
      requireFile(snapshot)
      variants += 1
    }

    for (const fixture of task.fixtures) {
      requireFile(`demos/shared/fixtures/${fixture}`)
    }
  }

  if (variants !== 72) throw new Error(`Matrix 变体数量错误：expected=72 actual=${variants}`)
  console.log('✅ Matrix resources complete (9 tasks x 8 runtimes)')
}

function checkTextNormalization() {
  if (normalize('a\r\nb\rc\n') !== 'a\nb\nc\n') throw new Error('CRLF 归一化规则失效')
  const cmdSource = requireFile('demos/cmd/00_env.bat')
  if (normalize(cmdSource).includes('\r')) throw new Error('CMD 源码归一化后仍含 CR')
  console.log('✅ Matrix text normalization complete')
}

function checkPageIntegration() {
  const page = requireFile('docs/matrix/experiments.md')
  const viewerCount = (page.match(/<MatrixExperimentViewer\b/g) || []).length
  if (viewerCount !== 1) throw new Error(`experiments.md 应包含一个 MatrixExperimentViewer，实际为 ${viewerCount}`)

  requireFile('docs/.vitepress/theme/components/MatrixExperimentViewer.vue')
  const catalog = requireFile('docs/.vitepress/theme/data/matrixExperiments.ts')
  if (!catalog.includes('import.meta.glob')) throw new Error('Matrix 数据目录未直接读取 demos 原始资源')
  console.log('✅ Matrix viewer page integration complete')
}

checkMatrixFiles()
checkTextNormalization()
checkPageIntegration()

