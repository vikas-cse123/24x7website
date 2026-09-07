import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// Load the project-root .env explicitly. The server runs from server/ (npm
// workspaces), so the default `dotenv/config` cwd lookup would miss it and the
// app would silently fall back to defaults.
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../../../.env') })

const isProduction = process.env.NODE_ENV === 'production'

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction,
  port: parseInt(process.env.PORT, 10) || 5000,
  clientOrigin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/24x7-website',

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-only-jwt-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieName: 'chhutti_token',
  },

  cookie: {
    // HTTP-only cookie settings.
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },

  otp: {
    // Development-only mock OTP behavior.
    enabled: process.env.OTP_ENABLED !== 'false',
    ttlSeconds: parseInt(process.env.OTP_TTL_SECONDS, 10) || 300,
    // In development, the OTP sent back in the API response for easy testing.
    devEchoOtp: !isProduction,
    // Email OTP settings
    emailTtlSeconds: parseInt(process.env.EMAIL_OTP_TTL_SECONDS, 10) || 600,
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5,
    resendCooldownSeconds: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 10) || 30,
  },

  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 465,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@24x7chhutti.com',
    get isConfigured() {
      return Boolean(this.host && this.user && this.pass)
    },
  },
}

export default config
