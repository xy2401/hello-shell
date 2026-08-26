export type MatrixRuntimeId =
  | 'bash'
  | 'zsh'
  | 'fish'
  | 'pwsh'
  | 'python'
  | 'cmd'
  | 'powershell5'
  | 'powershell7'

export interface MatrixTask {
  id: string
  number: string
  stem: string
  name: string
  verification: string
  description: string
  fixturePaths: string[]
}

export interface MatrixRuntime {
  id: MatrixRuntimeId
  name: string
  directory: string
  extension: string
  language: string
  platform: 'Linux' | 'Windows'
  collection: string
}

export interface MatrixInput {
  id: string
  name: string
  path: string
  content: string
  description: string
  kind: 'source' | 'fixture'
}

export interface MatrixVariant {
  task: MatrixTask
  runtime: MatrixRuntime
  sourceFile: string
  sourcePath: string
  outputFile: string
  outputPath: string
  source: string
  output: string
  inputs: MatrixInput[]
}

type RawModules = Record<string, string>

export const sourceModules = import.meta.glob('../../../../demos/**/*.{sh,zsh,fish,ps1,py,bat}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as RawModules

const snapshotModules = import.meta.glob('../../../../demos/**/*.out.txt', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as RawModules

export const fixtureModules = import.meta.glob('../../../../demos/shared/fixtures/**/*', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as RawModules

const fixtureDescriptions: Record<string, string> = {
  'orders.csv': '5 笔订单，其中 3 笔为 paid；用于 CSV 过滤和状态分组统计。',
  'data/app.log': '4 行应用日志，其中 2 行包含 request；用于模式匹配和行数统计。',
  'data/config.csv': '两项 name/value 配置；作为文件遍历和批处理输入。',
  'data/readme.txt': '一行说明文本；作为文件遍历和批处理输入。',
}

export function normalizeMatrixText(value: string): string {
  return value.replace(/\r\n?/g, '\n')
}

function readRaw(modules: RawModules, suffix: string): string {
  const normalizedSuffix = suffix.replace(/\\/g, '/')
  const entry = Object.entries(modules).find(([file]) => file.replace(/\\/g, '/').endsWith(normalizedSuffix))
  if (!entry) throw new Error(`Matrix 实验资源不存在：${suffix}`)
  return normalizeMatrixText(entry[1])
}

export const matrixTasks: MatrixTask[] = [
  {
    id: 'task-00', number: '00', stem: '00_env', name: '环境指纹',
    verification: '版本、运行体与平台',
    description: '由运行体自报版本、名称和平台，作为全部实验的版本基线。',
    fixturePaths: [],
  },
  {
    id: 'task-01', number: '01', stem: '01_hello_io', name: 'I/O 与退出码',
    verification: 'stdout、stderr 与子进程退出码',
    description: '区分标准输出和标准错误，并捕获子进程的非零退出码。',
    fixturePaths: [],
  },
  {
    id: 'task-02', number: '02', stem: '02_variables_quoting', name: '变量与引号',
    verification: '赋值、分词、插值与通配字面量',
    description: '用一致的结果对照不同运行体的变量、分词和插值机制。',
    fixturePaths: [],
  },
  {
    id: 'task-03', number: '03', stem: '03_args_parsing', name: '入参解析',
    verification: '位置参数、带空格参数与选项解析',
    description: '以 alice、"bob smith"、--verbose、-n 3 为统一样例参数。',
    fixturePaths: [],
  },
  {
    id: 'task-04', number: '04', stem: '04_control_flow', name: '控制流',
    verification: '求和、CSV 过滤与文件遍历',
    description: '对照循环、条件判断、逐行读取和 glob 遍历。',
    fixturePaths: ['orders.csv', 'data/app.log', 'data/config.csv', 'data/readme.txt'],
  },
  {
    id: 'task-05', number: '05', stem: '05_functions_scope', name: '函数与作用域',
    verification: '返回值、退出码与局部变量',
    description: '区分值通道与状态通道，并验证局部作用域。',
    fixturePaths: [],
  },
  {
    id: 'task-06', number: '06', stem: '06_pipes_files', name: '管道与文件',
    verification: 'glob、文本统计与 CSV 分组',
    description: '以文本管道、对象管道或显式代码完成同一组文件统计。',
    fixturePaths: ['orders.csv', 'data/app.log', 'data/config.csv', 'data/readme.txt'],
  },
  {
    id: 'task-07', number: '07', stem: '07_errors', name: '错误处理',
    verification: '捕获失败、继续执行与失败即停',
    description: '捕获一次失败并继续，再测量各运行体的失败即停语义。',
    fixturePaths: [],
  },
  {
    id: 'task-08', number: '08', stem: '08_real_world', name: '综合实战',
    verification: '复制、改名、校验与报告',
    description: '复制三个数据文件，改名日志，校验结果并生成摘要。',
    fixturePaths: ['data/app.log', 'data/config.csv', 'data/readme.txt'],
  },
]

export const matrixRuntimes: MatrixRuntime[] = [
  { id: 'bash', name: 'Bash', directory: 'bash', extension: 'sh', language: 'bash', platform: 'Linux', collection: '锁定镜像 · Docker' },
  { id: 'zsh', name: 'Zsh', directory: 'zsh', extension: 'zsh', language: 'zsh', platform: 'Linux', collection: '锁定 Alpine 基底 · Docker' },
  { id: 'fish', name: 'Fish', directory: 'fish', extension: 'fish', language: 'fish', platform: 'Linux', collection: '锁定 Alpine 基底 · Docker' },
  { id: 'pwsh', name: 'PowerShell 7', directory: 'pwsh', extension: 'ps1', language: 'powershell', platform: 'Linux', collection: '锁定镜像 · Docker' },
  { id: 'python', name: 'Python', directory: 'python', extension: 'py', language: 'python', platform: 'Linux', collection: '锁定镜像 · Docker' },
  { id: 'cmd', name: 'CMD', directory: 'cmd', extension: 'bat', language: 'bat', platform: 'Windows', collection: 'windows-latest · GitHub Actions' },
  { id: 'powershell5', name: 'Windows PowerShell 5.1', directory: 'powershell5', extension: 'ps1', language: 'powershell', platform: 'Windows', collection: 'windows-latest · GitHub Actions' },
  { id: 'powershell7', name: 'PowerShell 7（Windows）', directory: 'powershell7', extension: 'ps1', language: 'powershell', platform: 'Windows', collection: 'windows-latest · GitHub Actions' },
]

export function getMatrixVariant(taskId: string, runtimeId: MatrixRuntimeId): MatrixVariant {
  const task = matrixTasks.find((item) => item.id === taskId) ?? matrixTasks[0]
  const runtime = matrixRuntimes.find((item) => item.id === runtimeId) ?? matrixRuntimes[0]
  const sourceFile = `${task.stem}.${runtime.extension}`
  const outputFile = `${sourceFile}.out.txt`
  const sourcePath = `demos/${runtime.directory}/${sourceFile}`
  const outputPath = `demos/${runtime.directory}/${outputFile}`
  const source = readRaw(sourceModules, `/${sourcePath}`)
  const inputs: MatrixInput[] = [
    {
      id: 'source',
      name: sourceFile,
      path: sourcePath,
      content: source,
      description: task.description,
      kind: 'source',
    },
    ...task.fixturePaths.map((fixturePath) => ({
      id: `fixture:${fixturePath}`,
      name: fixturePath.split('/').pop() || fixturePath,
      path: `demos/shared/fixtures/${fixturePath}`,
      content: readRaw(fixtureModules, `/demos/shared/fixtures/${fixturePath}`),
      description: fixtureDescriptions[fixturePath],
      kind: 'fixture' as const,
    })),
  ]

  return {
    task,
    runtime,
    sourceFile,
    sourcePath,
    outputFile,
    outputPath,
    source,
    output: readRaw(snapshotModules, `/${outputPath}`),
    inputs,
  }
}
