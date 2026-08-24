import { Bash } from 'just-bash'

interface ExecuteMessage {
  type: 'execute'
  source: string
  fixtures: Record<string, string>
}

const OUTPUT_LIMIT = 64 * 1024

self.addEventListener('message', async (event: MessageEvent<ExecuteMessage>) => {
  if (event.data?.type !== 'execute') return
  const startedAt = performance.now()
  try {
    const bash = new Bash({
      files: event.data.fixtures,
      cwd: '/',
      env: { FIXTURES: '/fixtures', HOME: '/tmp', PATH: '/bin:/usr/bin' },
      executionLimitProfile: 'normal',
      executionLimits: {
        maxExecutionTimeMs: 5000,
        maxCommandCount: 20_000,
        maxLoopIterations: 20_000,
        maxOutputSize: OUTPUT_LIMIT,
        maxFileSystemBytes: 8 * 1024 * 1024,
      },
    })
    const result = await bash.exec(event.data.source.replace(/\r\n?/g, '\n'), { rawScript: true })
    self.postMessage({
      type: 'result',
      stdout: result.stdout.slice(0, OUTPUT_LIMIT),
      stderr: result.stderr.slice(0, OUTPUT_LIMIT),
      exitCode: result.exitCode,
      durationMs: Math.round(performance.now() - startedAt),
      truncated: result.stdout.length > OUTPUT_LIMIT || result.stderr.length > OUTPUT_LIMIT,
    })
  } catch (error) {
    self.postMessage({
      type: 'failure',
      message: error instanceof Error ? error.message : String(error),
      durationMs: Math.round(performance.now() - startedAt),
    })
  }
})

self.postMessage({ type: 'ready' })
