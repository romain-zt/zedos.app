import { z } from 'zod';

const normalizedEmail = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());

const optionalUrl = z
  .union([z.string().trim().url().max(2048), z.literal('')])
  .optional()
  .transform((value) => value || undefined);

const optionalShortText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .transform((value) => value || undefined);

export const WellnessBusinessTypeSchema = z.enum([
  'pilates',
  'yoga',
  'fitness',
  'personal-training',
  'massage',
  'wellness-centre',
  'beauty-care',
  'other-booking-business',
]);

export const PractitionerRangeSchema = z.enum(['solo', '2-5', '6-15', '16-plus']);

export const LocationRangeSchema = z.enum(['online', '1', '2-3', '4-plus']);

export const BookingPlatformSchema = z.enum([
  'none',
  'calendly',
  'planity',
  'mindbody',
  'fresha',
  'booksy',
  'momence',
  'other',
]);

export const WaitlistChallengeSchema = z.enum([
  'fragmented-tools',
  'booking-experience',
  'slow-changes',
  'brand-limitations',
  'custom-workflow',
  'replace-platform',
]);

export const LaunchTimeframeSchema = z.enum([
  '0-3-months',
  '3-6-months',
  '6-12-months',
  'exploring',
]);

export const WaitlistContactRequestSchema = z.object({
  stage: z.literal('contact'),
  name: z.string().trim().min(2).max(80),
  email: normalizedEmail,
  businessName: z.string().trim().min(2).max(120),
  businessType: WellnessBusinessTypeSchema,
  website: optionalUrl,
  consentToContact: z.literal(true),
  websiteTrap: z.string().max(200).optional().default(''),
});

export const WaitlistQualificationRequestSchema = z.object({
  stage: z.literal('qualification'),
  leadId: z.string().uuid(),
  practitionerRange: PractitionerRangeSchema.optional(),
  locationRange: LocationRangeSchema.optional(),
  bookingPlatform: BookingPlatformSchema.optional(),
  mainChallenge: WaitlistChallengeSchema.optional(),
  launchTimeframe: LaunchTimeframeSchema.optional(),
  desiredChange: optionalShortText(600),
});

export const WaitlistRequestSchema = z.discriminatedUnion('stage', [
  WaitlistContactRequestSchema,
  WaitlistQualificationRequestSchema,
]);

export const WaitlistContactResponseSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum(['created', 'updated']),
});

export const WaitlistQualificationResponseSchema = z.object({
  leadId: z.string().uuid(),
  status: z.literal('qualified'),
});

export type WellnessBusinessType = z.infer<typeof WellnessBusinessTypeSchema>;
export type WaitlistContactRequest = z.infer<typeof WaitlistContactRequestSchema>;
export type WaitlistQualificationRequest = z.infer<
  typeof WaitlistQualificationRequestSchema
>;
export type WaitlistRequest = z.infer<typeof WaitlistRequestSchema>;
export type WaitlistContactResponse = z.infer<typeof WaitlistContactResponseSchema>;
export type WaitlistQualificationResponse = z.infer<
  typeof WaitlistQualificationResponseSchema
>;
