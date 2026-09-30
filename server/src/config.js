// Reads settings from environment variables (see .env.example). Secrets stay
// in the environment and never in the code. The server refuses to start if
// something important is missing, so mistakes show up immediately.
import 'dotenv/config'

const env = process.env
const isProduction = env.NODE_ENV === 'production'

function required(name) {
  if (!env[name]) throw new Error(`Missing required setting ${name}. Copy .env.example to .env and fill it in.`)
  return env[name]
}

const jwtSecret = required('JWT_SECRET')
if (isProduction && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production.')
}

export const config = {
  isProduction,
  port: Number(env.PORT) || 4000,
  databaseUrl: required('DATABASE_URL'),
  // Render's external database addresses need SSL. Set DATABASE_SSL=true for those.
  databaseSsl: env.DATABASE_SSL === 'true',
  jwtSecret,
  // Web addresses allowed to call this API (comma separated).
  clientOrigins: (env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((o) => o.trim()).filter(Boolean),
  // Sign-up and sign-in attempts allowed per IP address per 15 minutes.
  authRateLimit: Number(env.AUTH_RATE_LIMIT) || 20,
  // TESTING ONLY: lets a person move their own report/order to the next stage,
  // because the owner and vendor sides are not built yet. Keep off for real use.
  demoTools: env.DEMO_TOOLS === 'true',
}
