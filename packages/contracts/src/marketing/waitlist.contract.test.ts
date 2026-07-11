import { describe, expect, it } from 'vitest';
import {
  WaitlistContactRequestSchema,
  WaitlistQualificationRequestSchema,
} from './waitlist';

describe('waitlist contracts', () => {
  it('accepts and normalizes a qualified contact application', () => {
    const result = WaitlistContactRequestSchema.parse({
      stage: 'contact',
      name: '  Jules Martin  ',
      email: '  JULES@STUDIO.FR ',
      businessName: '  Studio Juniper  ',
      businessType: 'pilates',
      website: 'https://studio-juniper.fr',
      consentToContact: true,
      websiteTrap: '',
    });

    expect(result).toMatchObject({
      name: 'Jules Martin',
      email: 'jules@studio.fr',
      businessName: 'Studio Juniper',
      businessType: 'pilates',
      website: 'https://studio-juniper.fr',
      consentToContact: true,
    });
  });

  it('rejects a contact application without explicit consent', () => {
    const result = WaitlistContactRequestSchema.safeParse({
      stage: 'contact',
      name: 'Jules Martin',
      email: 'jules@studio.fr',
      businessName: 'Studio Juniper',
      businessType: 'pilates',
      consentToContact: false,
    });

    expect(result.success).toBe(false);
  });

  it('accepts optional qualification details without free-text PII requirements', () => {
    const result = WaitlistQualificationRequestSchema.parse({
      stage: 'qualification',
      leadId: 'f6310ee8-0842-4ea9-9861-7de8947d822a',
      practitionerRange: '2-5',
      locationRange: '1',
      bookingPlatform: 'planity',
      mainChallenge: 'fragmented-tools',
      launchTimeframe: '0-3-months',
      desiredChange: 'Bring the booking journey into the studio website.',
    });

    expect(result.stage).toBe('qualification');
    expect(result.mainChallenge).toBe('fragmented-tools');
  });

  it('rejects an invalid lead id on qualification', () => {
    const result = WaitlistQualificationRequestSchema.safeParse({
      stage: 'qualification',
      leadId: 'not-a-uuid',
      practitionerRange: '2-5',
    });

    expect(result.success).toBe(false);
  });
});
