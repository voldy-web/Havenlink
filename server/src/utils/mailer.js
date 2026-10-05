// Sends email through Brevo (BREVO_API_KEY) or Resend (RESEND_API_KEY). With neither, nothing is sent: the
// message is kept in `outbox` (used by the tests) and, outside production, printed so you can follow the link while developing.
import { config } from '../config.js'

export const outbox = []

// "Haven Link <no-reply@example.com>" -> { name, email }
function parseFrom(from) {
  const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/)
  return m ? { name: m[1].replace(/^"|"$/g, '') || 'Haven Link', email: m[2] } : { name: 'Haven Link', email: from.trim() }
}

async function viaBrevo({ to, subject, text }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': config.brevoApiKey, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ sender: parseFrom(config.mailFrom), to: [{ email: to }], subject, textContent: text }),
  })
  if (!res.ok) throw new Error(`Brevo refused the message (${res.status}): ${(await res.text()).slice(0, 200)}`)
}

async function viaResend({ to, subject, text }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: config.mailFrom, to: [to], subject, text }),
  })
  if (!res.ok) throw new Error(`Resend refused the message (${res.status}).`)
}

export async function sendMail(mail) {
  if (config.brevoApiKey) { await viaBrevo(mail); return true }
  if (config.resendApiKey) { await viaResend(mail); return true }
  outbox.push(mail)
  if (outbox.length > 50) outbox.shift()
  if (!config.isProduction) console.log(`[mail not sent: no email key set] to ${mail.to}: ${mail.subject}\n${mail.text}`)
  else console.warn(`Email "${mail.subject}" was not sent because no email key (BREVO_API_KEY or RESEND_API_KEY) is set.`)
  return false
}
