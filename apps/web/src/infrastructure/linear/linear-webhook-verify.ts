import { createHmac, timingSafeEqual } from 'node:crypto';
import { Result, err, ok } from '@repo/result';
import { ExternalServiceError } from '@shared/errors/application-error';

/**
 * Verify a Linear webhook signature. Linear sends a `Linear-Signature` header
 * containing the HMAC-SHA256 of the raw body using LINEAR_WEBHOOK_SECRET.
 */
export function verifyLinearWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null,
  webhookSecret: string | null,
): Result<true, ExternalServiceError> {
  if (!webhookSecret) {
    return err(
      new ExternalServiceError('linear', 'LINEAR_WEBHOOK_SECRET is not configured', 503),
    );
  }
  if (!signatureHeader) {
    return err(new ExternalServiceError('linear', 'Missing Linear-Signature header', 400));
  }

  const expected = createHmac('sha256', webhookSecret)
    .update(typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody)
    .digest('hex');

  const providedBuf = Buffer.from(signatureHeader, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');

  if (providedBuf.length !== expectedBuf.length) {
    return err(new ExternalServiceError('linear', 'Signature mismatch', 401));
  }
  if (!timingSafeEqual(providedBuf, expectedBuf)) {
    return err(new ExternalServiceError('linear', 'Signature mismatch', 401));
  }
  return ok(true);
}
