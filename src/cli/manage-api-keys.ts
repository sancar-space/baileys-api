import { createApiKey, deleteApiKey, listApiKeys } from '../services/auth'
import { log } from '../logger'

const args = process.argv.slice(2)
const command = args[0]

async function main() {
  if (command === 'create') {
    const scope = args[1] ?? 'user'
    const key = args[2]
    if (!key) {
      console.error('Usage: bun manage-api-keys create <scope> <key>')
      process.exit(1)
    }
    await createApiKey(scope, key)
    console.log(`API key registered (scope: ${scope})`)
    process.exit(0)
  }

  if (command === 'list') {
    const keys = await listApiKeys()
    if (keys.length === 0) {
      console.log('No API keys registered')
    } else {
      for (const k of keys) {
        console.log(`${k.key}  scope=${k.scope}  createdAt=${k.createdAt}`)
      }
    }
    process.exit(0)
  }

  if (command === 'delete') {
    const key = args[1]
    if (!key) {
      console.error('Usage: bun manage-api-keys delete <key>')
      process.exit(1)
    }
    await deleteApiKey(key)
    console.log('API key deleted')
    process.exit(0)
  }

  console.error(`Unknown command: ${command ?? '(none)'}`)
  console.error('Available commands: create, list, delete')
  process.exit(1)
}

main().catch(err => {
  log.error({ err }, 'CLI error')
  process.exit(1)
})
