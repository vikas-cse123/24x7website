import nodemailer from 'nodemailer'
import config from '../config/index.js'

let transporter = null

function getTransporter() {
  if (transporter) return transporter
  if (!config.email.isConfigured) return null
  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  })
  return transporter
}

export function isEmailConfigured() {
  return config.email.isConfigured
}

function buildTextBody(otp, minutes, purpose, name = '') {
  const greeting = name ? `Hi ${name},` : 'Hi there,'
  if (purpose === 'passwordReset') {
    return `${greeting}\n\nSomeone requested a password reset for your 24x7 Chhutti account.\n\nYour password reset code is: ${otp}\n\nThis code is valid for ${minutes} minutes.\n\nFor your security, please do not share this code with anyone.\n\nIf you did not request a password reset, you can safely ignore this email.\n\nHappy travels,\n24x7 Chhutti Team\n\n---\nThis is an automated message, please do not reply.\n\nDeliverability note: For custom domain sending (e.g., @24x7chhutti.com), ensure SPF, DKIM, and DMARC are correctly configured for your domain's DNS. When using Gmail SMTP (smtp.gmail.com) with MAIL_FROM as the authenticated Gmail address, Gmail's SPF/DKIM is handled by Google; for a custom domain, configure SPF (v=spf1 include:_spf.google.com), DKIM (via Google Workspace), and DMARC (v=DMARC1) in your DNS. No code can guarantee inbox placement.`
  }
  return `${greeting}\n\nThanks for creating your account with 24x7 Chhutti.\n\nUse the verification code below to verify your email address:\n\n${otp}\n\nThis code is valid for ${minutes} minutes.\n\nFor your security, please do not share this code with anyone.\n\nIf you did not create an account with 24x7 Chhutti, you can safely ignore this email.\n\nHappy travels,\n24x7 Chhutti Team\n\n---\nThis is an automated message, please do not reply.\n\nDeliverability note: For custom domain sending, ensure SPF, DKIM, DMARC are configured. Gmail SMTP with consistent From address helps deliverability, but inbox placement cannot be guaranteed.`
}

function buildHtmlBody(otp, minutes, purpose, name = '') {
  const greeting = name ? `Hi ${name},` : 'Hi there,'
  const brandHeader = `<div style="text-align:center; padding: 16px 0; border-bottom: 1px solid #e5e7eb; margin-bottom: 24px;"><h1 style="margin:0; font-size: 20px; font-weight: 700; color: #0f172a;">24x7 Chhutti</h1></div>`
  const codeBlock = `<div style="text-align:center; margin: 24px 0;"><div style="display:inline-block; padding: 16px 32px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 28px; font-weight: 700; letter-spacing: 8px; color: #0f172a;">${otp}</div><p style="margin: 12px 0 0; font-size: 13px; color: #64748b;">This code is valid for ${minutes} minutes</p></div>`
  const footer = `<div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center;">Happy travels,<br/>24x7 Chhutti Team<br/><br/>This is an automated message, please do not reply.</div>`

  if (purpose === 'passwordReset') {
    return `
      ${brandHeader}
      <p style="font-size: 14px; color: #334155; line-height: 1.6;">${greeting}</p>
      <p style="font-size: 14px; color: #334155; line-height: 1.6;">Someone requested a password reset for your 24x7 Chhutti account. Use the code below to reset your password:</p>
      ${codeBlock}
      <p style="font-size: 13px; color: #64748b; line-height: 1.5; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 12px; margin: 16px 0;">For your security, please do not share this code with anyone.</p>
      <p style="font-size: 13px; color: #64748b; line-height: 1.5;">If you did not request a password reset, you can safely ignore this email.</p>
      ${footer}
    `
  }
  return `
    ${brandHeader}
    <p style="font-size: 14px; color: #334155; line-height: 1.6;">${greeting}</p>
    <p style="font-size: 14px; color: #334155; line-height: 1.6;">Thanks for creating your account with 24x7 Chhutti. Use the verification code below to verify your email address:</p>
    ${codeBlock}
    <p style="font-size: 13px; color: #64748b; line-height: 1.5; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 12px; margin: 16px 0;">For your security, please do not share this code with anyone.</p>
    <p style="font-size: 13px; color: #64748b; line-height: 1.5;">If you did not create an account with 24x7 Chhutti, you can safely ignore this email.</p>
    ${footer}
  `
}

export async function sendVerificationOtp(email, otp, name = '') {
  const minutes = Math.ceil(config.otp.emailTtlSeconds / 60)
  const text = buildTextBody(otp, minutes, 'verification', name)
  const htmlBody = buildHtmlBody(otp, minutes, 'verification', name)
  const html = `<!DOCTYPE html><html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; color: #0f172a;">${htmlBody}</body></html>`
  return sendMail({
    to: email,
    subject: 'Your 24x7 Chhutti verification code',
    text,
    html,
  })
}

export async function sendPasswordResetOtp(email, otp, name = '') {
  const minutes = Math.ceil(config.otp.emailTtlSeconds / 60)
  const text = buildTextBody(otp, minutes, 'passwordReset', name)
  const htmlBody = buildHtmlBody(otp, minutes, 'passwordReset', name)
  const html = `<!DOCTYPE html><html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; color: #0f172a;">${htmlBody}</body></html>`
  return sendMail({
    to: email,
    subject: 'Reset your 24x7 Chhutti password',
    text,
    html,
  })
}

async function sendMail({ to, subject, text, html }) {
  const trans = getTransporter()
  if (!trans) {
    if (!config.isProduction) {
      console.log(`[DEV] Email to ${to} | Subject: ${subject} | Text: ${text}`)
      return
    }
    const err = new Error('Email service is not configured. Please try again later.')
    err.status = 503
    throw err
  }
  try {
    await trans.sendMail({
      from: config.email.from,
      to,
      subject,
      text,
      html,
    })
  } catch (err) {
    console.error('Email send failed:', err.message)
    const e = new Error('Failed to send email. Please try again later.')
    e.status = 503
    throw e
  }
}
