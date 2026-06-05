import { createHmac, timingSafeEqual } from 'node:crypto';
import { Result, err, ok } from '@repo/result';
import { ExternalServiceError } from '@shared/errors/application-error';

/**
 * Verify a GitHub webhook signature (X-Hub-Signature-256). Returns ok(true) on
 * match, err(ExternalServiceError) on any failure mode (missing secret, missing
 * header, format mismatch, signature mismatch).
 *
 * Vendor-isolated: no @octokit dep, uses Node's HMAC + timingSafeEqual.
 */
export function verifyGithubWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null,
  webhookSecret: string | null,
): Result<true, ExternalServiceError> {
  if (!webhookSecret) {
    return err(
      new ExternalServiceError('github', 'GITHUB_WEBHOOK_SECRET is not configured', 503),
    );
  }
  if (!signatureHeader) {
    return err(
      new ExternalServiceError('github', 'Missing X-Hub-Signature-256 header', 400),
    );
  }
  if (!signatureHeader.startsWith('sha256=')) {
    return err(new ExternalServiceError('github', 'Invalid signature format', 400));
  }

  const provided = signatureHeader.slice('sha256='.length);
  const expected = createHmac('sha256', webhookSecret)
    .update(typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody)
    .digest('hex');

  const providedBuf = Buffer.from(provided, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');

  if (providedBuf.length !== expectedBuf.length) {
    return err(new ExternalServiceError('github', 'Signature mismatch', 401));
  }
  if (!timingSafeEqual(providedBuf, expectedBuf)) {
    return err(new ExternalServiceError('github', 'Signature mismatch', 401));
  }
  return ok(true);
}
