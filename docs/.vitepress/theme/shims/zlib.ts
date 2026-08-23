import { gunzipSync as gunzip, gzipSync as gzip } from 'fflate'

type ZlibOptions = {
  level?: number
  maxOutputLength?: number
}

export const constants = {
  Z_BEST_COMPRESSION: 9,
  Z_BEST_SPEED: 1,
  Z_DEFAULT_COMPRESSION: -1,
} as const

export function gzipSync(input: Uint8Array, options: ZlibOptions = {}) {
  const level = options.level === constants.Z_DEFAULT_COMPRESSION ? 6 : options.level
  return enforceLimit(gzip(input, { level: level as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | undefined }), options)
}

export function gunzipSync(input: Uint8Array, options: ZlibOptions = {}) {
  return enforceLimit(gunzip(input), options)
}

function enforceLimit(output: Uint8Array, options: ZlibOptions) {
  if (options.maxOutputLength !== undefined && output.byteLength > options.maxOutputLength) {
    throw new RangeError(`decompressed data exceeds limit (${options.maxOutputLength} bytes)`)
  }
  return output
}
