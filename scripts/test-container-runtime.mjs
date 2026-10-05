import test from 'node:test'
import assert from 'node:assert/strict'
import { gzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { runtimeLocation, validateManifest, fetchManifest, loadChunks } from '../docs/.vitepress/theme/utils/containerRuntime.mjs'

const bytes = Uint8Array.from([0, 97, 115, 109, 1, 0, 0, 0])
const gzip = gzipSync(bytes)
const digest = createHash('sha256').update(gzip).digest('hex')
const target = runtimeLocation('c2w', 'http://127.0.0.1:5177/runtime/')
const fixture = () => ({ schemaVersion: 1, runtimeId: 'shell/base', targetArch: 'riscv64', runtimeVersion: 'fixture', systemVersion: 'Alpine Linux 3.22', container2wasmVersion: '0.8.4', createdAt: '2026-10-05T00:00:00Z', totalRawSize: bytes.length, chunks: [{ filename: 'runtime-abcdef012345-part-00.gz', sha256: digest, compressedSize: gzip.length, rawSize: bytes.length }] })

test('three existing page IDs map to explicit shared assets and architectures', () => {
  assert.equal(target.assetBase, 'http://127.0.0.1:5177/runtime/shell/base/riscv64')
  assert.equal(runtimeLocation('c2w-shell').runtimeId, 'shell/multi')
  assert.equal(runtimeLocation('c2w-powershell').assetBase, 'https://wasm.2401.xyz/runtime/shell/powershell/amd64')
  for (const id of ['unknown', '__proto__', 'constructor']) assert.throws(() => runtimeLocation(id))
  assert.throws(() => runtimeLocation('c2w', 'file:///runtime'))
})
test('identity, architecture, unsafe filenames, totals and hashes are rejected before download', () => {
  for (const modify of [m => m.runtimeId = 'shell/multi', m => m.targetArch = 'amd64', m => m.schemaVersion = 2, m => m.totalRawSize++, m => m.chunks[0].filename = '../asset.gz', m => m.chunks[0].sha256 = 'bad', m => m.chunks.push(m.chunks[0])]) {
    const manifest = fixture(); modify(manifest)
    assert.throws(() => validateManifest(manifest, target))
  }
})
test('404 is unavailable; server, HTML and damaged manifest responses are actual errors', async () => {
  assert.equal(await fetchManifest(target, { fetchImpl: async () => new Response('', { status: 404 }) }), undefined)
  await assert.rejects(fetchManifest(target, { fetchImpl: async () => new Response('', { status: 500 }) }), /HTTP 500/)
  await assert.rejects(fetchManifest(target, { fetchImpl: async () => new Response('<html>') }), /JSON/)
  await assert.rejects(fetchManifest(target, { fetchImpl: async () => Response.json({}) }), /清单版本/)
})
test('verified gzip bytes are decompressed and ordered; URLs isolate cache by hash', async () => {
  let request
  const progress = []
  const result = await loadChunks(fixture(), target, { fetchImpl: async url => { request = url; return new Response(gzip) }, onProgress: (...values) => progress.push(values) })
  assert.deepEqual(result, bytes)
  assert(request.includes(`/shell/base/riscv64/runtime-abcdef012345-part-00.gz?sha256=${digest.slice(0, 12)}`))
  assert.deepEqual(progress, [[1, 1]])
})
test('size, digest, raw-size and HTTP failures propagate instead of producing a runtime', async () => {
  await assert.rejects(loadChunks(fixture(), target, { fetchImpl: async () => new Response(gzip.subarray(1)) }), /压缩体积/)
  const changed = Buffer.from(gzip); changed[10] ^= 1
  await assert.rejects(loadChunks(fixture(), target, { fetchImpl: async () => new Response(changed) }), /SHA-256/)
  const manifest = fixture(); manifest.chunks[0].rawSize++; manifest.totalRawSize++
  await assert.rejects(loadChunks(manifest, target, { fetchImpl: async () => new Response(gzip) }), /解压体积/)
  await assert.rejects(loadChunks(fixture(), target, { fetchImpl: async () => new Response('', { status: 503 }) }), /HTTP 503/)
})
test('an aborted load never publishes progress or late results', async () => {
  const controller = new AbortController()
  const progress = []
  await assert.rejects(loadChunks(fixture(), target, { signal: controller.signal, fetchImpl: async () => { controller.abort(); return new Response(gzip) }, onProgress: value => progress.push(value) }), { name: 'AbortError' })
  assert.deepEqual(progress, [])
})
test('multi-chunk downloads preserve manifest order despite response order', async () => {
  const manifest = fixture()
  manifest.chunks.push({ ...manifest.chunks[0], filename: 'runtime-abcdef012345-part-01.gz' })
  manifest.totalRawSize *= 2
  const result = await loadChunks(manifest, target, { fetchImpl: async url => { if (url.includes('part-00')) await new Promise(resolve => setTimeout(resolve, 10)); return new Response(gzip) } })
  assert.deepEqual(result, Uint8Array.from([...bytes, ...bytes]))
})

test('a failed download cancels peers and preserves the original failure', async () => {
  const manifest = fixture()
  manifest.chunks.push({ ...manifest.chunks[0], filename: 'runtime-abcdef012345-part-01.gz' })
  manifest.totalRawSize *= 2
  let peerAborted = false
  await assert.rejects(loadChunks(manifest, target, { fetchImpl: async (url, { signal }) => {
    if (url.includes('part-01')) return new Response('', { status: 503 })
    return new Promise((resolve, reject) => signal.addEventListener('abort', () => { peerAborted = true; reject(new DOMException('cancelled', 'AbortError')) }, { once: true }))
  } }), /HTTP 503/)
  assert(peerAborted)
})
