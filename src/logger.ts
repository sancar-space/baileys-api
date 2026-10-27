import pino from 'pino'

export const log = pino({
  level: Bun.env.LOG_LEVEL ?? 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
})

export const baileysLogger = pino({ level: Bun.env.BAILEYS_LOG_LEVEL ?? 'error' })
