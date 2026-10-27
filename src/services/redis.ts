import Redis from 'ioredis'
import { log } from '../logger'

let client: Redis | null = null

export function getRedis(): Redis {
  if (!client) {
    const url = Bun.env.REDIS_URL ?? 'redis://localhost:6379'
    const password = Bun.env.REDIS_PASSWORD || undefined

    client = new Redis(url, {
      password,
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    })

    client.on('error', (err: Error) => {
      log.warn({ err: err.message }, '[redis] connection error')
    })
  }
  return client
}
