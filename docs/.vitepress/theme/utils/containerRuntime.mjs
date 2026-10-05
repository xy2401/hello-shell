export const runtimeTargets = Object.freeze({
  c2w: { assetId: 'base', arch: 'riscv64' },
  'c2w-shell': { assetId: 'multi', arch: 'riscv64' },
  'c2w-powershell': { assetId: 'powershell', arch: 'amd64' },
})

export function runtimeLocation(id, base = 'https://wasm.2401.xyz/runtime') {
  const target = Object.hasOwn(runtimeTargets, id) ? runtimeTargets[id] : undefined
  if (!target) throw new Error(`未知容器运行时：${id}`)
  const url = new URL(base, 'http://localhost')
  if (!['http:', 'https:'].includes(url.protocol) || url.search || url.hash) throw new Error('运行时资产地址必须是 HTTP(S) 目录。')
  return { ...target, runtimeId: `shell/${target.assetId}`, assetBase: `${base.replace(/\/$/, '')}/shell/${target.assetId}/${target.arch}` }
}

export function validateManifest(manifest, target) {
  if (manifest?.schemaVersion !== 1) throw new Error('不支持的 Hello WASM 清单版本。')
  if (manifest.runtimeId !== target.runtimeId || manifest.targetArch !== target.arch) throw new Error('运行时清单身份或架构与当前入口不一致。')
  if (manifest.container2wasmVersion !== '0.8.4' || !manifest.runtimeVersion || !manifest.systemVersion || !Number.isFinite(Date.parse(manifest.createdAt))) throw new Error('运行时清单缺少有效版本信息。')
  if (!Array.isArray(manifest.chunks) || !manifest.chunks.length || manifest.chunks.length > 100) throw new Error('运行时清单没有有效分片。')
  const names = new Set()
  let size = 0
  for (const chunk of manifest.chunks) {
    if (!/^runtime-[a-f0-9]{12}-part-\d{2,}\.gz$/.test(chunk.filename) || names.has(chunk.filename) || !/^[a-f0-9]{64}$/.test(chunk.sha256)) throw new Error('运行时清单含无效文件名、重复分片或 SHA-256。')
    if (!Number.isInteger(chunk.rawSize) || chunk.rawSize < 1 || chunk.rawSize > 10 * 1024 * 1024 || !Number.isInteger(chunk.compressedSize) || chunk.compressedSize < 1 || chunk.compressedSize > 24 * 1024 * 1024) throw new Error('运行时分片体积超出协议范围。')
    names.add(chunk.filename)
    size += chunk.rawSize
  }
  if (size !== manifest.totalRawSize) throw new Error('运行时原始体积与分片合计不一致。')
  return manifest
}

export async function fetchManifest(target, { fetchImpl = fetch, signal } = {}) {
  const response = await fetchImpl(`${target.assetBase}/manifest.json`, { signal, cache: 'no-cache' })
  if (response.status === 404) return undefined
  if (!response.ok) throw new Error(`Hello WASM 清单请求失败（HTTP ${response.status}）。`)
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Hello WASM 清单响应不是 JSON。')
  return validateManifest(await response.json(), target)
}

export async function loadChunks(manifest, target, { fetchImpl = fetch, signal, onProgress = () => {} } = {}) {
  validateManifest(manifest, target)
  const pending = new AbortController()
  const abort = () => pending.abort(signal?.reason)
  signal?.addEventListener('abort', abort, { once: true })
  if (signal?.aborted) abort()
  const buffers = new Array(manifest.chunks.length)
  let next = 0
  let completed = 0
  let firstError
  const checkAbort = () => { if (pending.signal.aborted) throw new DOMException('运行时加载已取消。', 'AbortError') }
  const download = async () => {
    while (next < manifest.chunks.length) {
      checkAbort()
      const index = next++
      const chunk = manifest.chunks[index]
      const response = await fetchImpl(`${target.assetBase}/${chunk.filename}?sha256=${chunk.sha256.slice(0, 12)}`, { signal: pending.signal })
      if (!response.ok) throw new Error(`分片 ${chunk.filename} 下载失败（HTTP ${response.status}）。`)
      const compressed = await response.arrayBuffer()
      checkAbort()
      if (compressed.byteLength !== chunk.compressedSize) throw new Error(`分片 ${chunk.filename} 压缩体积不一致。`)
      const actual = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', compressed)), byte => byte.toString(16).padStart(2, '0')).join('')
      if (actual !== chunk.sha256) throw new Error(`分片 ${chunk.filename} SHA-256 校验失败。`)
      const bytes = new Uint8Array(compressed)
      if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) throw new Error('分片必须保持 gzip 字节，不能由 HTTP 层提前解压。')
      if (typeof DecompressionStream === 'undefined') throw new Error('当前浏览器缺少 gzip 解压能力。')
      const raw = await new Response(new Response(compressed).body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
      checkAbort()
      if (raw.byteLength !== chunk.rawSize) throw new Error(`分片 ${chunk.filename} 解压体积不一致。`)
      buffers[index] = raw
      onProgress(++completed, manifest.chunks.length)
    }
  }
  try {
    const downloads = Array.from({ length: Math.min(4, manifest.chunks.length) }, download)
    await Promise.allSettled(downloads.map(promise => promise.catch(error => { firstError ??= error; pending.abort(); throw error })))
    if (firstError) throw firstError
    checkAbort()
    const combined = new Uint8Array(manifest.totalRawSize)
    let offset = 0
    for (const buffer of buffers) { combined.set(new Uint8Array(buffer), offset); offset += buffer.byteLength }
    return combined
  } finally {
    signal?.removeEventListener('abort', abort)
  }
}
