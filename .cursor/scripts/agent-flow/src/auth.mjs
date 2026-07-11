/**
 * Simple bearer-token auth for HTTP and WebSocket, driven by AUTH_TOKEN.
 * Static UI files stay public; the API and WS require the token.
 */
import { timingSafeEqual } from "crypto";

/** @param {string} expected */
export function createAuth(expected) {
  if (!expected) {
    throw new Error("AUTH_TOKEN is required — set it in .env");
  }

  /** @param {string | undefined | null} candidate */
  function checkToken(candidate) {
    if (!candidate) return false;
    const a = Buffer.from(String(candidate));
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  /**
   * Token from an HTTP request: Authorization: Bearer <token> header, or
   * ?token= query param (used by the WebSocket handshake from the browser).
   * @param {import('http').IncomingMessage} req
   */
  function tokenFromRequest(req) {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) return header.slice(7).trim();
    try {
      const url = new URL(req.url || "/", "http://local");
      return url.searchParams.get("token");
    } catch {
      return null;
    }
  }

  /** @param {import('http').IncomingMessage} req */
  function isAuthorized(req) {
    return checkToken(tokenFromRequest(req));
  }

  return { checkToken, tokenFromRequest, isAuthorized };
}
