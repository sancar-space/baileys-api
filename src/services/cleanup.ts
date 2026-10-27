import { join } from 'node:path'
import { readdir, stat, rm } from 'node:fs/promises'
import { log } from '../logger'

const STORAGE_BASE = Bun.env.STORAGE_PATH ?? '/app/storage'
const ENABLED = Bun.env.MEDIA_CLEANUP_ENABLED !== 'false'
const INTERVAL_MS = parseInt(Bun.env.MEDIA_CLEANUP_INTERVAL_MS ?? '3600000')
const MAX_AGE_MS = parseInt(Bun.env.MEDIA_MAX_AGE_HOURS ?? '24') * 3600_000

async function cleanupMediaDir(dir: string): Promise<number> {
  let removed = 0
  const now = Date.now()
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile()) continue
      const filePath = join(dir, entry.name)
      const { mtimeMs } = await stat(filePath)
      if (now - mtimeMs > MAX_AGE_MS) {
        await rm(filePath)
        removed++
      }
    }
  } catch {}
  return removed
}

export function startMediaCleanup(): void {
  if (!ENABLED) return

  setInterval(async () => {
    const mediaDir = join(STORAGE_BASE, 'media')
    const removed = await cleanupMediaDir(mediaDir)
    if (removed > 0) log.info({ removed }, 'media cleanup complete')
  }, INTERVAL_MS)
}
