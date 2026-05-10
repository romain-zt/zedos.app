/**
 * Explicit type exports for Drizzle tables
 * These are concrete types to work around Drizzle's $inferInsert not properly
 * resolving across package boundaries in monorepo setups.
 */

// User insert type - all fields that can be provided during insert
export interface NewUserRow {
  id?: string;
  email: string;
  passwordHash: string;
  name: string;
  creditBalance?: number;
  graceUsed?: boolean;
  starterCreditsGranted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// User update type - partial of all updatable columns
export interface UserUpdate {
  email?: string;
  name?: string;
  passwordHash?: string;
  creditBalance?: number;
  graceUsed?: boolean;
  starterCreditsGranted?: boolean;
}

// Project insert type
export interface NewProjectRow {
  id?: string;
  userId: string;
  name: string;
  description?: string | null;
  phase?: string;
  architectureStartedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Project update type
export interface ProjectUpdate {
  userId?: string;
  name?: string;
  description?: string | null;
  phase?: string;
  architectureStartedAt?: Date | null;
}

// Credit transaction insert type
export interface CreditTransactionInsert {
  id?: string;
  userId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  operationType?: string | null;
  metadata?: unknown;
  correlationId?: string | null;
  createdAt?: Date;
}
