import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Bash } from 'just-bash'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const normalize = (value) => value.replace(/\r\n?/g, '\n').replace(/\n$/, '')

const inlineBashTasks = [
  '02_variables_quoting',
  '04_control_flow',
  '05_functions_scope',
  '06_pipes_files',
  '07_errors',
  '08_real_world',
]

const pitfallFiles = [
  'bash-unquoted-expansion.sh',
  'zsh-nomatch.zsh',
  'fish-pipeline-scope.fish',
  'cmd-delayed-expansion.bat',
  'powershell-last-exit-code.ps1',
]

const labDocs = [
  'docs/matrix/experiments.md',
  'docs/matrix/quoting-variables.md',
  'docs/matrix/quoting-matrix.md',
  'docs/matrix/args-matrix.md',
  'docs/matrix/control-flow.md',
  'docs/matrix/functions-pipes.md',
  'docs/matrix/globbing-matrix.md',
  'docs/matrix/errors-signals.md',
  'docs/matrix/error-handling-matrix.md',
  'docs/matrix/portability-matrix.md',
  'docs/matrix/comparison/shell-vs-python.md',
  ...['bash', 'zsh', 'fish', 'cmd', 'powershell'].flatMap((product) => [
    `docs/products/${product}/syntax.md`,
    `docs/products/${product}/args.md`,
    `docs/products/${product}/pitfalls.md`,
  ]),
]

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8')
}

function collectFixtures(directory, prefix = '/fixtures') {
  const files = {}
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name)
    const virtualPath = `${prefix}/${entry.name}`
    if (entry.isDirectory()) Object.assign(files, collectFixtures(absolute, virtualPath))
    else files[virtualPath] = fs.readFileSync(absolute, 'utf8')
  }
  return files
}

function checkCatalogFiles() {
  for (const file of pitfallFiles) {
    const source = path.join(ROOT, 'demos', 'pitfalls', file)
    const snapshot = `${source}.out.txt`
    if (!fs.existsSync(source) || !fs.existsSync(snapshot)) throw new Error(`坑位案例资源不完整：${file}`)
  }
  for (const file of labDocs) {
    const count = (read(file).match(/<ShellLessonLab\b/g) || []).length
    if (count !== 1) throw new Error(`${file} 应恰好包含一个 ShellLessonLab，实际为 ${count}`)
  }
  if (normalize('a\r\nb\r\n') !== 'a\nb') throw new Error('CRLF 归一化规则失效')
  console.log('✅ lesson catalog files and page integration complete')
}

async function checkBashOutput(file, snapshotFile, expectedDifference) {
  const fixtures = collectFixtures(path.join(ROOT, 'demos', 'shared', 'fixtures'))
  const bash = new Bash({
    files: fixtures,
    cwd: '/',
    env: { FIXTURES: '/fixtures', HOME: '/tmp', PATH: '/bin:/usr/bin' },
    executionLimitProfile: 'normal',
    executionLimits: { maxExecutionTimeMs: 5000, maxOutputSize: 64 * 1024 },
  })
  const result = await bash.exec(read(file).replace(/\r\n?/g, '\n'), { rawScript: true })
  const expected = read(snapshotFile)
  const matches = normalize(result.stdout) === normalize(expected) && normalize(result.stderr) === '' && result.exitCode === 0
  if (expectedDifference) {
    if (matches || !normalize(result.stdout).includes(expectedDifference) || result.exitCode !== 0 || normalize(result.stderr) !== '') {
      throw new Error(`${file} 的已知模拟器差异发生变化\nstdout=${result.stdout}\nstderr=${result.stderr}\nexit=${result.exitCode}`)
    }
    return
  }
  if (!matches) {
    throw new Error(`${file} 页内回归失败\nstdout=${result.stdout}\nstderr=${result.stderr}\nexit=${result.exitCode}`)
  }
}

async function main() {
  checkCatalogFiles()
  for (const task of inlineBashTasks) {
    await checkBashOutput(
      `demos/bash/${task}.sh`,
      `demos/bash/${task}.sh.out.txt`,
      task === '04_control_flow' ? 'paidCount=0' : undefined,
    )
  }
  await checkBashOutput('demos/pitfalls/bash-unquoted-expansion.sh', 'demos/pitfalls/bash-unquoted-expansion.sh.out.txt')
  console.log('✅ JUST-BASH regression passed (5 exact, 1 Node process-substitution smoke, 1 pitfall)')
}

main().catch((error) => {
  console.error(`❌ ${error.message || error}`)
  process.exit(1)
})
