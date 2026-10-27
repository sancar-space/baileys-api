import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  type WASocket,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import { toDataURL } from 'qrcode'
import { join } from 'node:path'
import { mkdir } from 'node:fs/promises'
import { log, baileysLogger } from '../logger'
import type { SessionStatus } from '../types'

const STORAGE_BASE = Bun.env.STORAGE_PATH ?? '/app/storage'

interface SessionEntry {
  status: SessionStatus
  socket?: WASocket
  retryCount: number
}

const sessions = new Map<string, SessionEntry>()

async function deliverWebhook(
  instanceId: string,
  event: string,
  data: Record<string, unknown>,
  webhookUrl?: string,
): Promise<void> {
  const url = webhookUrl ?? Bun.env.WEBHOOK_URL ?? ''
  if (!url) return

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        instanceId,
        timestamp: new Date().toISOString(),
        data,
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) log.warn({ instanceId, event, status: res.status }, 'webhook non-2xx')
  } catch (err) {
    log.warn({ instanceId, event, err }, 'webhook delivery failed')
  }
}

export async function connectSession(
  instanceId: string,
  webhookUrl?: string,
): Promise<SessionStatus> {
  const existing = sessions.get(instanceId)
  if (existing && existing.status.status !== 'disconnected') {
    return { ...existing.status, qr: undefined }
  }

  const sessionDir = join(STORAGE_BASE, 'sessions', instanceId)
  await mkdir(sessionDir, { recursive: true })

  const statusObj: SessionStatus = {
    id: instanceId,
    status: 'connecting',
    webhookUrl: webhookUrl ?? Bun.env.WEBHOOK_URL ?? undefined,
  }
  const entry: SessionEntry = { status: statusObj, retryCount: 0 }
  sessions.set(instanceId, entry)

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir)

  const socket = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: baileysLogger as any,
    browser: ['Baileys API', 'Chrome', '126.0.0'],
    connectTimeoutMs: 60_000,
    keepAliveIntervalMs: 25_000,
    retryRequestDelayMs: 250,
  })

  entry.socket = socket

  socket.ev.on('creds.update', saveCreds)

  socket.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      try {
        const qrDataUrl = await toDataURL(qr)
        statusObj.status = 'qr_pending'
        statusObj.qr = qrDataUrl
        log.info({ instanceId }, 'QR code ready')
        await deliverWebhook(instanceId, 'qr.updated', { qr: qrDataUrl }, statusObj.webhookUrl)
      } catch (err) {
        log.warn({ instanceId, err }, 'QR generation failed')
      }
    }

    if (connection === 'open') {
      statusObj.status = 'connected'
      statusObj.qr = undefined
      statusObj.connectedAt = new Date().toISOString()
      statusObj.phoneNumber = socket.user?.id?.split(':')[0]
      statusObj.pushName = socket.user?.name
      entry.retryCount = 0
      log.info({ instanceId, phone: statusObj.phoneNumber }, 'WhatsApp connected')
      await deliverWebhook(
        instanceId,
        'connection.update',
        { status: 'connected', phoneNumber: statusObj.phoneNumber },
        statusObj.webhookUrl,
      )
    }

    if (connection === 'close') {
      const code = (lastDisconnect?.error as Boom)?.output?.statusCode
      const loggedOut = code === DisconnectReason.loggedOut
      statusObj.status = 'disconnected'
      log.info({ instanceId, code, loggedOut }, 'WhatsApp disconnected')
      await deliverWebhook(
        instanceId,
        'connection.update',
        { status: 'disconnected', code },
        statusObj.webhookUrl,
      )

      if (loggedOut) {
        sessions.delete(instanceId)
      } else if (entry.retryCount < 10) {
        entry.retryCount++
        const delay = Math.min(1000 * 2 ** entry.retryCount, 60_000)
        log.info({ instanceId, retryCount: entry.retryCount, delay }, 'scheduling reconnect')
        setTimeout(() => connectSession(instanceId, webhookUrl), delay)
      } else {
        log.error({ instanceId }, 'max retries reached, giving up')
        sessions.delete(instanceId)
      }
    }
  })

  socket.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const msg of messages) {
      if (msg.key.fromMe) continue

      const jid = msg.key.remoteJid ?? ''
      const msgTypes = Object.keys(msg.message ?? {})
      const messageType = msgTypes.find(t => t !== 'messageContextInfo') ?? 'unknown'
      const phoneNumber = jid.replace(/@s\.whatsapp\.net$/, '').replace(/@g\.us$/, '')

      let content = ''
      if (msg.message?.conversation) {
        content = msg.message.conversation
      } else if (msg.message?.extendedTextMessage?.text) {
        content = msg.message.extendedTextMessage.text
      } else if (msg.message?.imageMessage?.caption) {
        content = msg.message.imageMessage.caption
      } else if (msg.message?.videoMessage?.caption) {
        content = msg.message.videoMessage.caption
      }

      await deliverWebhook(
        instanceId,
        'message.received',
        {
          key: msg.key,
          pushName: msg.pushName,
          phoneNumber,
          jid,
          messageType,
          content,
          message: msg.message,
          timestamp: msg.messageTimestamp,
          isGroup: jid.endsWith('@g.us'),
        },
        statusObj.webhookUrl,
      )
    }
  })

  return { ...statusObj, qr: undefined }
}

export async function sendText(
  instanceId: string,
  jid: string,
  text: string,
): Promise<void> {
  const entry = sessions.get(instanceId)
  if (!entry?.socket) throw new Error(`Instance "${instanceId}" not found`)
  if (entry.status.status !== 'connected') {
    throw new Error(`Instance "${instanceId}" not ready (${entry.status.status})`)
  }
  const normalizedJid = jid.includes('@') ? jid : `${jid}@s.whatsapp.net`
  await entry.socket.sendMessage(normalizedJid, { text })
}

export async function sendMedia(
  instanceId: string,
  jid: string,
  opts: { url: string; type: 'image' | 'audio' | 'video' | 'document'; caption?: string; filename?: string },
): Promise<void> {
  const entry = sessions.get(instanceId)
  if (!entry?.socket) throw new Error(`Instance "${instanceId}" not found`)
  if (entry.status.status !== 'connected') {
    throw new Error(`Instance "${instanceId}" not ready (${entry.status.status})`)
  }
  const normalizedJid = jid.includes('@') ? jid : `${jid}@s.whatsapp.net`
  const msgContent: Record<string, unknown> = { url: opts.url }
  if (opts.caption) msgContent.caption = opts.caption
  if (opts.filename) msgContent.fileName = opts.filename
  await entry.socket.sendMessage(normalizedJid, { [opts.type]: msgContent } as any)
}

export function getSession(instanceId: string): SessionStatus | undefined {
  const entry = sessions.get(instanceId)
  if (!entry) return undefined
  return { ...entry.status, qr: undefined }
}

export function getSessionWithQr(instanceId: string): SessionStatus | undefined {
  return sessions.get(instanceId)?.status
}

export function listSessions(): SessionStatus[] {
  return Array.from(sessions.values()).map(e => ({ ...e.status, qr: undefined }))
}

export async function disconnectSession(instanceId: string): Promise<void> {
  const entry = sessions.get(instanceId)
  if (!entry) return
  try {
    await entry.socket?.logout()
  } catch {}
  try {
    entry.socket?.end(undefined)
  } catch {}
  sessions.delete(instanceId)
  log.info({ instanceId }, 'session disconnected')
}

export async function restorePersistedSessions(): Promise<void> {
  const sessionsDir = join(STORAGE_BASE, 'sessions')
  try {
    const { readdir } = await import('node:fs/promises')
    await mkdir(sessionsDir, { recursive: true })
    const entries = await readdir(sessionsDir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        log.info({ instanceId: entry.name }, 'restoring session')
        connectSession(entry.name).catch(err => {
          log.warn({ instanceId: entry.name, err }, 'session restore failed')
        })
      }
    }
  } catch (err) {
    log.warn({ err }, 'could not read sessions dir')
  }
}
