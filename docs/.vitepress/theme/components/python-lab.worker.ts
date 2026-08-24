interface PyodideApi {
  FS: {
    mkdirTree(path: string): void
    writeFile(path: string, content: string, options?: { encoding?: string }): void
  }
  globals: {
    set(name: string, value: unknown): void
    get(name: string): unknown
    delete(name: string): void
  }
  setStdout(options: { batched(value: string): void }): void
  setStderr(options: { batched(value: string): void }): void
  runPythonAsync(source: string): Promise<unknown>
}

interface WorkerScope extends WorkerGlobalScope {
  loadPyodide?: (options: { indexURL: string }) => Promise<PyodideApi>
}

interface ExecuteMessage {
  type: 'execute'
  source: string
  sourceFileName: string
  fixtures: Record<string, string>
}

const scope = self as unknown as WorkerScope
const PYODIDE_BASE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
const OUTPUT_LIMIT = 64 * 1024
let pyodide: PyodideApi

function appendOutput(current: string, value: string): string {
  if (current.length >= OUTPUT_LIMIT) return current
  return `${current}${value}\n`.slice(0, OUTPUT_LIMIT)
}

async function initialize() {
  try {
    importScripts(`${PYODIDE_BASE}pyodide.js`)
    if (!scope.loadPyodide) throw new Error('Pyodide 加载器未注册')
    pyodide = await scope.loadPyodide({ indexURL: PYODIDE_BASE })
    scope.postMessage({ type: 'ready' })
  } catch (error) {
    scope.postMessage({ type: 'startup-failure', message: error instanceof Error ? error.message : String(error) })
  }
}

scope.addEventListener('message', async (event: MessageEvent<ExecuteMessage>) => {
  if (event.data?.type !== 'execute' || !pyodide) return
  const startedAt = performance.now()
  let stdout = ''
  let stderr = ''
  pyodide.setStdout({ batched: (value) => { stdout = appendOutput(stdout, value) } })
  pyodide.setStderr({ batched: (value) => { stderr = appendOutput(stderr, value) } })

  try {
    await pyodide.runPythonAsync("import shutil; shutil.rmtree('/fixtures', ignore_errors=True); shutil.rmtree('/tmp/work', ignore_errors=True)")
    for (const [path, content] of Object.entries(event.data.fixtures)) {
      pyodide.FS.mkdirTree(path.slice(0, path.lastIndexOf('/')))
      pyodide.FS.writeFile(path, content, { encoding: 'utf8' })
    }
    pyodide.globals.set('__lab_source', event.data.source.replace(/\r\n?/g, '\n'))
    pyodide.globals.set('__lab_filename', event.data.sourceFileName)
    await pyodide.runPythonAsync(`
import sys, traceback
sys.argv = [__lab_filename]
__lab_exit_code = 0
try:
    exec(compile(__lab_source, __lab_filename, "exec"), {"__name__": "__main__", "__file__": __lab_filename})
except SystemExit as exc:
    __lab_exit_code = exc.code if isinstance(exc.code, int) else (0 if exc.code is None else 1)
except BaseException:
    traceback.print_exc()
    __lab_exit_code = 1
`)
    const exitCode = Number(pyodide.globals.get('__lab_exit_code'))
    pyodide.globals.delete('__lab_source')
    pyodide.globals.delete('__lab_filename')
    pyodide.globals.delete('__lab_exit_code')
    scope.postMessage({
      type: 'result',
      stdout,
      stderr,
      exitCode,
      durationMs: Math.round(performance.now() - startedAt),
      truncated: stdout.length >= OUTPUT_LIMIT || stderr.length >= OUTPUT_LIMIT,
    })
  } catch (error) {
    scope.postMessage({
      type: 'failure',
      message: error instanceof Error ? error.message : String(error),
      durationMs: Math.round(performance.now() - startedAt),
    })
  }
})

void initialize()
