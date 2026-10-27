export interface SessionStatus {
  id: string
  status: 'connecting' | 'qr_pending' | 'connected' | 'disconnected'
  phoneNumber?: string
  pushName?: string
  qr?: string
  connectedAt?: string
  webhookUrl?: string
}

export interface SendTextPayload {
  jid: string
  message: string
  quotedMessageId?: string
}

export interface SendMediaPayload {
  jid: string
  mediaUrl: string
  mediaType: 'image' | 'audio' | 'video' | 'document'
  caption?: string
  filename?: string
}

export interface WebhookPayload {
  event: 'message.received' | 'connection.update' | 'qr.updated'
  instanceId: string
  timestamp: string
  data: Record<string, unknown>
}
