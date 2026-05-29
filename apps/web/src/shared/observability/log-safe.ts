/**
 * Redact sensitive values before they appear in structured logs.
 */

const SENSITIVE_KEY_PATTERN =
  /(?:secret|token|password|authorization|signature|session|email|card|payment|api[_-]?key)/i;

/** Mask opaque identifiers while keeping a short prefix for correlation. */
export function redactOpaqueId(value: string): string {
  if (value.length <= 8) return '[redacted]';
  return `${value.slice(0, 4)}…[redacted]`;
}

export function redactLogValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(redactLogValue);
  if (value instanceof Error) {
    return { errorName: value.name, errorMessage: value.message };
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        out[key] =
          typeof nested === 'string' ? redactOpaqueId(nested) : '[redacted]';
      } else {
        out[key] = redactLogValue(nested);
      }
    }
    return out;
  }
  return value;
}

export function redactLogData(data: Record<string, unknown>): Record<string, unknown> {
  return redactLogValue(data) as Record<string, unknown>;
}

/** Stable shape for Zod outbound/inbound validation failures in API logs. */
export function validationFailureData(flatten: {
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
}): Record<string, unknown> {
  return { validationErrors: flatten };
}
