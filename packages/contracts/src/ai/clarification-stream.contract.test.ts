import { describe, it, expect } from 'vitest';
import { ClarificationStreamJsonSchema } from './clarification-stream';

describe('ClarificationStreamJsonSchema', () => {
  const valid = {
    reasoning: 'We need to bound MVP.',
    message: 'Which segment first?',
    decision_ui: {
      type: 'single_choice' as const,
      title: 'Target',
      description: 'Pick one',
      options: [{ id: 'a', label: 'SMB' }],
      allow_custom: true,
      allow_not_sure: true,
    },
    prd_section_affected: 'Target Users',
    progress_hint: 'Scoping',
    suggested_credit_type: 'clarification' as const,
  };

  it('parses full object with decision_ui', () => {
    expect(ClarificationStreamJsonSchema.safeParse(valid).success).toBe(true);
  });

  it('parses decision_ui null', () => {
    const r = ClarificationStreamJsonSchema.safeParse({ ...valid, decision_ui: null });
    expect(r.success).toBe(true);
  });

  it('rejects invalid suggested_credit_type', () => {
    const r = ClarificationStreamJsonSchema.safeParse({
      ...valid,
      suggested_credit_type: 'other',
    });
    expect(r.success).toBe(false);
  });

  it('rejects missing reasoning', () => {
    const bad = { ...valid };
    delete (bad as { reasoning?: string }).reasoning;
    expect(ClarificationStreamJsonSchema.safeParse(bad).success).toBe(false);
  });
});
