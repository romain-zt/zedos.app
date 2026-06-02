import { z } from 'zod';

export const BillingInvoiceSchema = z.object({
  id: z.string().min(1),
  documentType: z.enum(['invoice', 'receipt']).default('invoice'),
  number: z.string().nullable(),
  amountPaidCents: z.number().int().nonnegative(),
  currency: z.string().min(1),
  status: z.string().nullable(),
  createdAt: z.string().min(1),
  hostedInvoiceUrl: z.string().url().nullable(),
  invoicePdfUrl: z.string().url().nullable(),
});

export type BillingInvoice = z.infer<typeof BillingInvoiceSchema>;

export const ListBillingInvoicesResponseSchema = z.object({
  invoices: z.array(BillingInvoiceSchema),
});

export type ListBillingInvoicesResponse = z.infer<typeof ListBillingInvoicesResponseSchema>;

export const BillingPaymentMethodSchema = z.object({
  hasSavedPaymentMethod: z.boolean(),
  brand: z.string().nullable(),
  last4: z.string().nullable(),
  expMonth: z.number().int().nullable(),
  expYear: z.number().int().nullable(),
});

export type BillingPaymentMethod = z.infer<typeof BillingPaymentMethodSchema>;
