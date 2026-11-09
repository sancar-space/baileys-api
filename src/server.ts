import { Elysia } from 'elysia'
import { isValidApiKey } from './services/auth'
import {
  connectSession,
  getSession,
  getSessionWithQr,
  listSessions,
  disconnectSession,
  sendText,
  sendMedia,
  restorePersistedSessions,
} from './services/sessions'
import { startMediaCleanup } from './services/cleanup'
import { log } from './logger'

function extractKey(request: Request): string {
  const auth = request.headers.get('Authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  return request.headers.get('X-API-Key') ?? ''
}

const authPlugin = new Elysia({ name: 'auth' }).onBeforeHandle(
  async ({ request, error }) => {
    const key = extractKey(request)
    if (!(await isValidApiKey(key))) return error(401, { error: 'Unauthorized' })
  },
)

const app = new Elysia()
  .get('/status', () => ({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    instances: listSessions().length,
    timestamp: new Date().toISOString(),
  }))
  .use(authPlugin)
  .get('/instances', () => listSessions())
  .post('/instances', async ({ body, set }) => {
    const { instanceId, webhookUrl } = body as { instanceId?: string; webhookUrl?: string }
    if (!instanceId) {
      set.status = 400
      return { error: 'instanceId is required' }
    }
    // Force reconnect: disconnect existing session first so QR is always regenerated
    const existing = getSession(instanceId)
    if (existing) {
      await disconnectSession(instanceId)
    }
    const status = await connectSession(instanceId, webhookUrl)
    return status
  })
  .get('/instances/:id', ({ params, set }) => {
    const session = getSession(params.id)
    if (!session) {
      set.status = 404
      return { error: 'Instance not found' }
    }
    return session
  })
  .get('/instances/:id/qr', ({ params, set }) => {
    const session = getSessionWithQr(params.id)
    if (!session) {
      set.status = 404
      return { error: 'Instance not found' }
    }
    if (!session.qr) {
      // Return 200 with current status so callers can poll without treating it as an error
      return { qr: null, status: session.status, instanceId: params.id }
    }
    return { qr: session.qr, status: session.status, instanceId: params.id }
  })
  .post('/instances/:id/send-text', async ({ params, body, set }) => {
    const { jid, message } = body as { jid?: string; message?: string }
    if (!jid || !message) {
      set.status = 400
      return { error: 'jid and message are required' }
    }
    try {
      await sendText(params.id, jid, message)
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Send failed'
      set.status = 422
      return { error: msg }
    }
  })
  .post('/instances/:id/send-media', async ({ params, body, set }) => {
    const { jid, mediaUrl, mediaType, caption, filename } = body as {
      jid?: string
      mediaUrl?: string
      mediaType?: 'image' | 'audio' | 'video' | 'document'
      caption?: string
      filename?: string
    }
    if (!jid || !mediaUrl || !mediaType) {
      set.status = 400
      return { error: 'jid, mediaUrl and mediaType are required' }
    }
    try {
      await sendMedia(params.id, jid, { url: mediaUrl, type: mediaType, caption, filename })
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Send failed'
      set.status = 422
      return { error: msg }
    }
  })
  .delete('/instances/:id', async ({ params, set }) => {
    const session = getSession(params.id)
    if (!session) {
      set.status = 404
      return { error: 'Instance not found' }
    }
    await disconnectSession(params.id)
    return { success: true }
  })
  .onError(({ error, code }) => {
    if (code === 'VALIDATION') return { error: 'Invalid request' }
    log.error({ error }, 'unhandled error')
  })

async function startServer() {
  const port = parseInt(Bun.env.PORT ?? '3025')

  await restorePersistedSessions()
  startMediaCleanup()

  app.listen(port)
  log.info({ port }, 'Baileys API started')
}

startServer().catch(err => {
  log.error({ err }, 'startup failed')
  process.exit(1)
})
