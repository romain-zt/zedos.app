import { z } from 'zod';

export const DriftSignalKindSchema = z.enum(['DRIFT-01', 'DRIFT-02', 'DRIFT-03', 'DRIFT-04']);
export type DriftSignalKindContract = z.infer<typeof DriftSignalKindSchema>;

export const DriftSignalSeveritySchema = z.enum(['info', 'warn', 'critical']);
export type DriftSignalSeverityContract = z.infer<typeof DriftSignalSeveritySchema>;

export const DriftSignalSourceSchema = z.enum(['webhook', 'scheduled', 'backfill']);
export type DriftSignalSourceContract = z.infer<typeof DriftSignalSourceSchema>;

export const DriftSignalStatusSchema = z.enum(['open', 'resolved', 'dismissed']);
export type DriftSignalStatusContract = z.infer<typeof DriftSignalStatusSchema>;

export const DriftSignalDTOSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  kind: DriftSignalKindSchema,
  severity: DriftSignalSeveritySchema,
  summary: z.string(),
  source: DriftSignalSourceSchema,
  status: DriftSignalStatusSchema,
  createdAt: z.coerce.date(),
  resolvedAt: z.coerce.date().nullable(),
  dismissedAt: z.coerce.date().nullable(),
});

export type DriftSignalDTO = z.infer<typeof DriftSignalDTOSchema>;

export const ListDriftSignalsResponseSchema = z.object({
  signals: z.array(DriftSignalDTOSchema),
});

export type ListDriftSignalsResponse = z.infer<typeof ListDriftSignalsResponseSchema>;

export const ResolveDriftSignalRequestSchema = z.object({
  action: z.enum(['resolve', 'dismiss', 'reopen']),
});

export type ResolveDriftSignalRequest = z.infer<typeof ResolveDriftSignalRequestSchema>;
