/**
 * Credits Contracts
 * 
 * Zod schemas for credit operations, requests, and responses.
 */

import { z } from 'zod';

/**
 * Credit Balance DTO
 */
export const CreditBalanceDTOSchema = z.object({
  userId: z.string(),
  amount: z.number().nonnegative(),
  graceUsed: z.boolean(),
  starterCreditsGranted: z.boolean(),
});

export type CreditBalanceDTO = z.infer<typeof CreditBalanceDTOSchema>;

/**
 * Credit Transaction DTO
 */
export const CreditTransactionDTOSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(['grant', 'purchase', 'auto_reload', 'consumption']),
  amount: z.number(),
  balanceAfter: z.number().optional(),
  operationType: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
});

export type CreditTransactionDTO = z.infer<typeof CreditTransactionDTOSchema>;

/**
 * Credit Check Request
 */
export const CreditCheckRequestSchema = z.object({
  operationType: z.string(),
});

export type CreditCheckRequest = z.infer<typeof CreditCheckRequestSchema>;

/**
 * Credit Check Response
 */
export const CreditCheckResponseSchema = z.object({
  canProceed: z.boolean(),
  currentBalance: z.number(),
  requiredAmount: z.number(),
  graceApplicable: z.boolean(),
  graceWillExpire: z.boolean(),
  message: z.string(),
});

export type CreditCheckResponse = z.infer<typeof CreditCheckResponseSchema>;

/**
 * Credits Info Response
 */
export const CreditsInfoResponseSchema = z.object({
  creditBalance: z.number(),
  graceUsed: z.boolean(),
  starterCreditsGranted: z.boolean(),
  recentTransactions: z.array(CreditTransactionDTOSchema),
});

export type CreditsInfoResponse = z.infer<typeof CreditsInfoResponseSchema>;
