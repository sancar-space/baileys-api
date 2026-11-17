import { Elysia } from 'elysia'
import { isValidApiKey } from './services/auth'
import {
  connectSession,
  getSession,
  getSessionWithQr,
  listSessions,
  disconnectSession,
  clearSessionDir,
  sendText,
  sendMedia,
  restorePersistedSessions,
  getReconnectCooldown,
  clearReconnectCooldown,
  requestPairingCode,
} from './services/sessions'
import { startMediaCleanup } from './services/cleanup'
import { log } from './logger'
import { getConnectPageHtml } from './connectPage'

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
  .get('/connect/:id', ({ params }) => {
    const html = getConnectPageHtml(params.id)
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  })
  .get('/connect/:id/status', ({ params, set }) => {
    const session = getSession(params.id)
    if (!session) { set.status = 404; return { error: 'Instance not found' } }
    return session
  })
  .get('/connect/:id/qr', ({ params, set }) => {
    const session = getSessionWithQr(params.id)
    if (!session) { set.status = 404; return { error: 'Instance not found' } }
    if (!session.qr) return { qr: null, status: session.status, instanceId: params.id }
    return { qr: session.qr, status: session.status, instanceId: params.id }
  })
  .post('/connect/:id/start', async ({ params, set }) => {
    clearReconnectCooldown(params.id)
    const existing = getSession(params.id)
    if (existing) await disconnectSession(params.id)
    await clearSessionDir(params.id)
    const status = await connectSession(params.id, undefined, true)
    return status
  })
  .post('/connect/:id/pairing-code', async ({ params, body, set }) => {
    const { phoneNumber } = body as { phoneNumber?: string }
    if (!phoneNumber) { set.status = 400; return { error: 'phoneNumber is required' } }
    clearReconnectCooldown(params.id)
    const existing = getSession(params.id)
    if (existing) await disconnectSession(params.id)
    await clearSessionDir(params.id)
    await connectSession(params.id, undefined, true)
    await new Promise(r => setTimeout(r, 3000))
    try {
      const code = await requestPairingCode(params.id, phoneNumber)
      return { code }
    } catch (err) {
      set.status = 422
      return { error: err instanceof Error ? err.message : 'Failed to get pairing code' }
    }
  })
  .use(authPlugin)
  .get('/instances', () => listSessions())
  .post('/instances', async ({ body, set }) => {
    const { instanceId, webhookUrl } = body as { instanceId?: string; webhookUrl?: string }
    if (!instanceId) {
      set.status = 400
      return { error: 'instanceId is required' }
    }
    // Block rapid reconnects after WhatsApp 401 (prevents 515 loop from Chatwoot auto-retry)
    const cooldown = getReconnectCooldown(instanceId)
    if (cooldown) {
      const secondsLeft = Math.ceil((cooldown.until - Date.now()) / 1000)
      set.status = 429
      return { error: `Reconnect cooldown active after 401 (${secondsLeft}s remaining)` }
    }
    // Reconnect using existing session files (Signal sessions preserved).
    // Clearing session files would destroy Signal ratchet state and cause Bad MAC
    // on all subsequent messages. The QR flow is triggered automatically when
    // no creds exist, or explicitly via POST /connect/:id/start.
    clearReconnectCooldown(instanceId)
    const existing = getSession(instanceId)
    if (existing) {
      await disconnectSession(instanceId)
    }
    // freshStart=false: existing creds are reused; auto-retry is allowed.
    const status = await connectSession(instanceId, webhookUrl, false)
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
  .post('/instances/:id/pairing-code', async ({ params, body, set }) => {
    const { phoneNumber } = body as { phoneNumber?: string }
    if (!phoneNumber) { set.status = 400; return { error: 'phoneNumber is required' } }
    clearReconnectCooldown(params.id)
    const existing = getSession(params.id)
    if (existing) await disconnectSession(params.id)
    await clearSessionDir(params.id)
    await connectSession(params.id, undefined, true)
    await new Promise(r => setTimeout(r, 3000))
    try {
      const code = await requestPairingCode(params.id, phoneNumber)
      return { code }
    } catch (err) {
      set.status = 422
      return { error: err instanceof Error ? err.message : 'Failed to get pairing code' }
    }
  })
  .onError(({ error, code }) => {
    if (code === 'VALIDATION') return { error: 'Invalid request' }
    log.error({ error }, 'unhandled error')
  })

async function startServer() {
  const port = parseInt(Bun.env.PORT ?? '3025')

  // Auto-restore skipped: stale sessions cause 428/405 reconnect loops;
  // admins must click Reconectar in the Chatwoot UI after each restart.
  startMediaCleanup()

  app.listen(port)
  log.info({ port }, 'Baileys API started')
}

startServer().catch(err => {
  log.error({ err }, 'startup failed')
  process.exit(1)
})
