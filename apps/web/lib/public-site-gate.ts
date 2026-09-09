import { NextResponse } from 'next/server'

/** Browser prompt credentials. Override with env; turn off with PUBLIC_SITE_GATE_DISABLED=true. */
export const DEFAULT_PUBLIC_SITE_GATE_USER = 'zedos'
export const DEFAULT_PUBLIC_SITE_GATE_PASSWORD = 'pilot'

export type PublicSiteGateEnv = {
  disabled?: string
  e2eMode?: string
  user?: string
  password?: string
}

export function readPublicSiteGateEnv(
  env: NodeJS.ProcessEnv = process.env
): PublicSiteGateEnv {
  return {
    disabled: env.PUBLIC_SITE_GATE_DISABLED,
    e2eMode: env.E2E_MODE,
    user: env.PUBLIC_SITE_GATE_USER,
    password: env.PUBLIC_SITE_GATE_PASSWORD,
  }
}

export function isPublicSiteGateEnabled(env: PublicSiteGateEnv): boolean {
  if (env.disabled === 'true') return false
  if (env.e2eMode === 'true') return false
  return true
}

/** Marketing surfaces only — app login, share links, and webhooks stay reachable. */
export function isPublicSiteGatedPath(pathname: string): boolean {
  if (pathname === '/') return true
  if (pathname.startsWith('/legal/')) return true
  if (pathname === '/api/waitlist') return true
  return false
}

export function isPublicSiteGateAuthorized(
  authorizationHeader: string | null,
  env: PublicSiteGateEnv
): boolean {
  const expectedUser = env.user || DEFAULT_PUBLIC_SITE_GATE_USER
  const expectedPassword = env.password || DEFAULT_PUBLIC_SITE_GATE_PASSWORD
  const parsed = parseBasicAuth(authorizationHeader)
  if (!parsed) return false
  return (
    timingSafeEqual(parsed.user, expectedUser) &&
    timingSafeEqual(parsed.password, expectedPassword)
  )
}

export function unauthorizedPublicSiteGateResponse(): NextResponse {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Zedos"',
      'Cache-Control': 'no-store',
    },
  })
}

function parseBasicAuth(
  header: string | null
): { user: string; password: string } | null {
  if (!header) return null
  const match = /^Basic\s+(.+)$/i.exec(header.trim())
  if (!match?.[1]) return null
  try {
    const decoded = atob(match[1])
    const colon = decoded.indexOf(':')
    if (colon === -1) return null
    return {
      user: decoded.slice(0, colon),
      password: decoded.slice(colon + 1),
    }
  } catch {
    return null
  }
}

function timingSafeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length)
  let mismatch = left.length === right.length ? 0 : 1
  for (let i = 0; i < length; i++) {
    const leftCode = i < left.length ? left.charCodeAt(i) : 0
    const rightCode = i < right.length ? right.charCodeAt(i) : 0
    mismatch |= leftCode ^ rightCode
  }
  return mismatch === 0
}
