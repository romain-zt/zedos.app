import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PUBLIC_SITE_GATE_PASSWORD,
  DEFAULT_PUBLIC_SITE_GATE_USER,
  isPublicSiteGateAuthorized,
  isPublicSiteGateEnabled,
  isPublicSiteGatedPath,
  unauthorizedPublicSiteGateResponse,
} from '@/lib/public-site-gate'

function basicHeader(user: string, password: string): string {
  return `Basic ${btoa(`${user}:${password}`)}`
}

describe('isPublicSiteGateEnabled', () => {
  it('is on by default so the public landing stays locked', () => {
    expect(isPublicSiteGateEnabled({})).toBe(true)
  })

  it('turns off when PUBLIC_SITE_GATE_DISABLED=true', () => {
    expect(isPublicSiteGateEnabled({ disabled: 'true' })).toBe(false)
  })

  it('turns off in E2E mode so Playwright can hit public routes', () => {
    expect(isPublicSiteGateEnabled({ e2eMode: 'true' })).toBe(false)
  })
})

describe('isPublicSiteGatedPath', () => {
  it('locks the landing, legal pages, and waitlist', () => {
    expect(isPublicSiteGatedPath('/')).toBe(true)
    expect(isPublicSiteGatedPath('/legal/privacy')).toBe(true)
    expect(isPublicSiteGatedPath('/legal/terms')).toBe(true)
    expect(isPublicSiteGatedPath('/api/waitlist')).toBe(true)
  })

  it('does not lock app login, share links, or auth APIs', () => {
    expect(isPublicSiteGatedPath('/sign-in')).toBe(false)
    expect(isPublicSiteGatedPath('/login')).toBe(false)
    expect(isPublicSiteGatedPath('/sign-up')).toBe(false)
    expect(isPublicSiteGatedPath('/share/abc')).toBe(false)
    expect(isPublicSiteGatedPath('/api/auth/sign-in/email')).toBe(false)
    expect(isPublicSiteGatedPath('/api/stripe/webhook')).toBe(false)
    expect(isPublicSiteGatedPath('/dashboard')).toBe(false)
  })
})

describe('isPublicSiteGateAuthorized', () => {
  const env = {}

  it('accepts the default hardcoded credentials', () => {
    expect(
      isPublicSiteGateAuthorized(
        basicHeader(DEFAULT_PUBLIC_SITE_GATE_USER, DEFAULT_PUBLIC_SITE_GATE_PASSWORD),
        env
      )
    ).toBe(true)
  })

  it('rejects missing, malformed, and wrong credentials', () => {
    expect(isPublicSiteGateAuthorized(null, env)).toBe(false)
    expect(isPublicSiteGateAuthorized('Bearer nope', env)).toBe(false)
    expect(isPublicSiteGateAuthorized(basicHeader('zedos', 'wrong'), env)).toBe(false)
    expect(isPublicSiteGateAuthorized(basicHeader('wrong', 'pilot'), env)).toBe(false)
  })

  it('accepts env overrides', () => {
    const custom = { user: 'lab', password: 'secret' }
    expect(isPublicSiteGateAuthorized(basicHeader('lab', 'secret'), custom)).toBe(true)
    expect(
      isPublicSiteGateAuthorized(
        basicHeader(DEFAULT_PUBLIC_SITE_GATE_USER, DEFAULT_PUBLIC_SITE_GATE_PASSWORD),
        custom
      )
    ).toBe(false)
  })
})

describe('unauthorizedPublicSiteGateResponse', () => {
  it('sends 401 with a browser login prompt header', () => {
    const response = unauthorizedPublicSiteGateResponse()
    expect(response.status).toBe(401)
    expect(response.headers.get('WWW-Authenticate')).toBe('Basic realm="Zedos"')
  })
})
