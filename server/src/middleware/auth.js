import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import config from '../config/index.js'

export function getTokenFromCookies(req) {
  return req.cookies?.[config.jwt.cookieName] || null
}

export function setAuthCookie(res, token) {
  res.cookie(config.jwt.cookieName, token, {
    httpOnly: config.cookie.httpOnly,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: config.cookie.maxAge,
    path: '/',
  })
}

export function clearAuthCookie(res) {
  res.clearCookie(config.jwt.cookieName, {
    httpOnly: config.cookie.httpOnly,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    path: '/',
  })
}

// Protect routes: require a valid auth cookie and an active user.
export async function requireAuth(req, res, next) {
  try {
    const token = getTokenFromCookies(req)
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated' })
    }

    let payload
    try {
      payload = jwt.verify(token, config.jwt.secret)
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired session' })
    }

    const user = await User.findById(payload.sub)
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Account not found or disabled' })
    }

    req.user = user
    req.userId = user.id
    return next()
  } catch (err) {
    return next(err)
  }
}

// Optional auth: attach user if a valid cookie is present, otherwise continue.
export async function optionalAuth(req, _res, next) {
  try {
    const token = getTokenFromCookies(req)
    if (token) {
      try {
        const payload = jwt.verify(token, config.jwt.secret)
        const user = await User.findById(payload.sub)
        if (user && user.isActive) {
          req.user = user
          req.userId = user.id
        }
      } catch {
        // ignore invalid token
      }
    }
    return next()
  } catch (err) {
    return next(err)
  }
}

// Role-based authorization. Must run AFTER requireAuth so req.user is the
// server-verified user loaded from the database (never trust a client-supplied
// role). Returns 403 when the authenticated user's role is not allowed.
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' })
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: you do not have permission to access this resource',
      })
    }
    return next()
  }
}
