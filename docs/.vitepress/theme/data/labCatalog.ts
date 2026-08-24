export type ExecutionRoute = 'inline' | 'workbench' | 'snapshot'
export type ComparisonStatus = 'pass' | 'difference' | 'unsupported' | 'error'
export type LabRuntime = 'just-bash' | 'pyodide' | 'container2wasm' | 'snapshot'
export type LabVariantId =
  | 'bash'
  | 'zsh'
  | 'fish'
  | 'pwsh'
  | 'python'
  | 'cmd'
  | 'powershell5'
  | 'powershell7'

export interface ExecutionResult {
  stdout: string
  stderr: string
  exitCode: number
  durationMs: number
  status: ComparisonStatus
  message?: string
}

export interface LabVariant {
  id: LabVariantId
  label: string
  language: string
  source: string
  sourceFileName: string
  expectedStdout: string
  expectedStderr: string
  expectedExitCode: number
  fixtures: Record<string, string>
  route: ExecutionRoute
  runtime: LabRuntime
  workbenchHref?: string
  limitation?: string
}

export interface LabCase {
  id: string
  title: string
  topic: string
  description: string
  variants: LabVariant[]
}

type RawModules = Record<string, string>

const scripts = import.meta.glob('../../../../demos/**/*.{sh,zsh,fish,ps1,py,bat}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as RawModules

const snapshots = import.meta.glob('../../../../demos/**/*.out.txt', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as RawModules

const fixtureModules = import.meta.glob('../../../../demos/shared/fixtures/**/*', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as RawModules

export function normalizeLabText(value: string): string {
  return value.replace(/\r\n?/g, '\n')
}

export function comparableLabText(value: string): string {
  return normalizeLabText(value).replace(/\n$/, '')
}

const textFrom = (modules: RawModules, suffix: string): string => {
  const entry = Object.entries(modules).find(([path]) => path.replace(/\\/g, '/').endsWith(suffix))
  if (!entry) throw new Error(`实验资源不存在：${suffix}`)
  return normalizeLabText(entry[1])
}

const sharedFixtures: Record<string, string> = Object.fromEntries(
  Object.entries(fixtureModules).map(([path, content]) => {
    const relative = path.replace(/\\/g, '/').split('/demos/shared/fixtures/')[1]
    return [`/fixtures/${relative}`, normalizeLabText(content)]
  }),
)

const variantDefinitions: Record<LabVariantId, { label: string; language: string; extension: string }> = {
  bash: { label: 'Bash', language: 'bash', extension: 'sh' },
  zsh: { label: 'Zsh', language: 'zsh', extension: 'zsh' },
  fish: { label: 'Fish', language: 'fish', extension: 'fish' },
  pwsh: { label: 'PowerShell（Linux）', language: 'powershell', extension: 'ps1' },
  python: { label: 'Python', language: 'python', extension: 'py' },
  cmd: { label: 'CMD', language: 'batch', extension: 'bat' },
  powershell5: { label: 'Windows PowerShell 5.1', language: 'powershell', extension: 'ps1' },
  powershell7: { label: 'PowerShell 7', language: 'powershell', extension: 'ps1' },
}

const taskDefinitions = [
  ['task-00', '00_env', '环境指纹', '确认运行体、系统与架构。'],
  ['task-01', '01_hello_io', 'I/O 与退出码', '区分标准输出、标准错误和子进程退出码。'],
  ['task-02', '02_variables_quoting', '变量与引号', '比较插值、分词和通配符字面量。'],
  ['task-03', '03_args_parsing', '入参解析', '解析位置参数、长选项和带空格参数。'],
  ['task-04', '04_control_flow', '控制流', '对照条件、循环和 fixture 遍历。'],
  ['task-05', '05_functions_scope', '函数与作用域', '观察返回值、退出码与局部作用域。'],
  ['task-06', '06_pipes_files', '管道与文件', '处理文本、文件和统计结果。'],
  ['task-07', '07_errors', '错误处理', '捕获失败并验证是否继续执行。'],
  ['task-08', '08_real_world', '综合实战', '完成复制、重命名、校验和报告。'],
] as const

const taskVariantIds = Object.keys(variantDefinitions) as LabVariantId[]
const bashInlineTasks = new Set(['task-02', 'task-04', 'task-05', 'task-06', 'task-07', 'task-08'])
const pythonInlineTasks = new Set(['task-00', 'task-02', 'task-04', 'task-06', 'task-08'])

function taskExecution(id: string, variant: LabVariantId): Pick<LabVariant, 'route' | 'runtime' | 'workbenchHref' | 'limitation'> {
  if (variant === 'bash' && bashInlineTasks.has(id)) {
    return { route: 'inline', runtime: 'just-bash' }
  }
  if (variant === 'python' && pythonInlineTasks.has(id)) {
    return { route: 'inline', runtime: 'pyodide' }
  }
  if (variant === 'bash' || variant === 'zsh' || variant === 'fish' || variant === 'python') {
    const query = new URLSearchParams({ case: id, variant, shell: variant }).toString()
    return {
      route: 'workbench',
      runtime: 'container2wasm',
      workbenchHref: `/playground/container2wasm.html?${query}`,
      limitation: '该脚本依赖真实 Shell、子进程或运行环境，请在完整容器工作台运行。',
    }
  }
  return {
    route: 'snapshot',
    runtime: 'snapshot',
    limitation: '该运行体目前不在浏览器内执行；源码与仓库实测快照仍可对照。',
  }
}

const taskCases: LabCase[] = taskDefinitions.map(([id, stem, title, description]) => ({
  id,
  title: `${id.replace('task-', '任务 ')}：${title}`,
  topic: title,
  description,
  variants: taskVariantIds.map((variantId) => {
    const definition = variantDefinitions[variantId]
    const fileName = `${stem}.${definition.extension}`
    return {
      id: variantId,
      label: definition.label,
      language: definition.language,
      source: textFrom(scripts, `/demos/${variantId}/${fileName}`),
      sourceFileName: fileName,
      expectedStdout: textFrom(snapshots, `/demos/${variantId}/${fileName}.out.txt`),
      expectedStderr: '',
      expectedExitCode: 0,
      fixtures: sharedFixtures,
      ...taskExecution(id, variantId),
    }
  }),
}))

interface PitfallDefinition {
  id: string
  title: string
  topic: string
  description: string
  variant: LabVariantId
  fileName: string
  route: ExecutionRoute
  runtime: LabRuntime
}

const pitfallDefinitions: PitfallDefinition[] = [
  {
    id: 'pitfall-bash-quoting',
    title: 'Bash 坑位：未引用变量展开',
    topic: '分词与 glob',
    description: '同一变量在引用与未引用时产生不同的参数数量。',
    variant: 'bash',
    fileName: 'bash-unquoted-expansion.sh',
    route: 'inline',
    runtime: 'just-bash',
  },
  {
    id: 'pitfall-zsh-nomatch',
    title: 'Zsh 坑位：NOMATCH',
    topic: '未匹配 glob',
    description: '比较默认 NOMATCH 与 (N) 限定符。',
    variant: 'zsh',
    fileName: 'zsh-nomatch.zsh',
    route: 'workbench',
    runtime: 'container2wasm',
  },
  {
    id: 'pitfall-fish-pipeline',
    title: 'Fish 坑位：管道作用域',
    topic: '子 Shell 与变量',
    description: '观察管道循环内的计数为何无法带回当前 Shell。',
    variant: 'fish',
    fileName: 'fish-pipeline-scope.fish',
    route: 'workbench',
    runtime: 'container2wasm',
  },
  {
    id: 'pitfall-cmd-delayed-expansion',
    title: 'CMD 坑位：延迟变量展开',
    topic: '括号块解析时机',
    description: '对照 %VALUE% 与 !VALUE! 在括号块中的值。',
    variant: 'cmd',
    fileName: 'cmd-delayed-expansion.bat',
    route: 'snapshot',
    runtime: 'snapshot',
  },
  {
    id: 'pitfall-powershell-last-exit',
    title: 'PowerShell 坑位：$LASTEXITCODE',
    topic: '原生命令与 cmdlet',
    description: '证明 cmdlet 失败不会更新 $LASTEXITCODE。',
    variant: 'powershell7',
    fileName: 'powershell-last-exit-code.ps1',
    route: 'snapshot',
    runtime: 'snapshot',
  },
]

const pitfallCases: LabCase[] = pitfallDefinitions.map((item) => {
  const definition = variantDefinitions[item.variant]
  const workbenchHref = item.route === 'workbench'
    ? `/playground/container2wasm.html?${new URLSearchParams({ case: item.id, variant: item.variant, shell: item.variant })}`
    : undefined
  return {
    id: item.id,
    title: item.title,
    topic: item.topic,
    description: item.description,
    variants: [{
      id: item.variant,
      label: definition.label,
      language: definition.language,
      source: textFrom(scripts, `/demos/pitfalls/${item.fileName}`),
      sourceFileName: item.fileName,
      expectedStdout: textFrom(snapshots, `/demos/pitfalls/${item.fileName}.out.txt`),
      expectedStderr: '',
      expectedExitCode: 0,
      fixtures: sharedFixtures,
      route: item.route,
      runtime: item.runtime,
      workbenchHref,
      limitation: item.route === 'snapshot'
        ? '该平台运行体暂不在浏览器内执行；下方展示仓库实测快照。'
        : item.route === 'workbench'
          ? '该案例需要真实 Shell，请载入完整容器工作台。'
          : undefined,
    }],
  }
})

export const labCases: LabCase[] = [...taskCases, ...pitfallCases]

export function getLabCase(id: string): LabCase | undefined {
  return labCases.find((item) => item.id === id)
}

export function getLabVariant(caseId: string, variantId: string): LabVariant | undefined {
  return getLabCase(caseId)?.variants.find((item) => item.id === variantId)
}
