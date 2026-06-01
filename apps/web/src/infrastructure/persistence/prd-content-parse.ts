import { PrdVersionContentSchema, type PrdVersionContent } from '@repo/contracts/prd';

/** Parse DB JSON into a contract-valid PRD body, with intake / legacy fallbacks. */
export function parsePrdVersionContent(value: unknown): PrdVersionContent | null {
  if (value == null) return null;

  const parsed = PrdVersionContentSchema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }

  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const intake: Record<string, string> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (typeof entry === 'string') {
        intake[key] = entry;
      }
    }
    if (Object.keys(intake).length > 0) {
      return intake;
    }
  }

  return { source: 'legacy', summary: '' };
}
