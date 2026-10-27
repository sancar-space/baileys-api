import { getRedis } from './redis'

const KEY_PREFIX = 'apikey:'

export async function isValidApiKey(key: string): Promise<boolean> {
  if (!key) return false

  // Accept static API_KEY from env (fallback for simple setups)
  if (Bun.env.API_KEY && key === Bun.env.API_KEY) return true

  const redis = getRedis()
  const value = await redis.get(`${KEY_PREFIX}${key}`)
  return value !== null
}

export async function createApiKey(scope: string, key: string): Promise<void> {
  const redis = getRedis()
  await redis.set(`${KEY_PREFIX}${key}`, JSON.stringify({ scope, createdAt: new Date().toISOString() }))
}

export async function deleteApiKey(key: string): Promise<void> {
  const redis = getRedis()
  await redis.del(`${KEY_PREFIX}${key}`)
}

export async function listApiKeys(): Promise<Array<{ key: string; scope: string; createdAt: string }>> {
  const redis = getRedis()
  const keys = await redis.keys(`${KEY_PREFIX}*`)
  const result = []
  for (const k of keys) {
    const val = await redis.get(k)
    if (val) {
      result.push({ key: k.replace(KEY_PREFIX, ''), ...JSON.parse(val) })
    }
  }
  return result
}
