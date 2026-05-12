/**
 * Explicit type exports for Drizzle tables
 * These are concrete types to work around Drizzle's $inferInsert not properly
 * resolving across package boundaries in monorepo setups.
 */

// User insert type - all fields that can be provided during insert
export interface NewUserRow {
  id?: string;
  email: string;
  passwordHash?: string | null;
  name: string;
  emailVerified?: boolean;
  image?: string | null;
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
  emailVerified?: boolean;
  image?: string | null;
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

// PrdVersion insert type
export interface PrdVersionInsert {
  id?: string;
  projectId: string;
  versionNumber: number;
  content?: unknown | null;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// QuestionHistory insert type
export interface QuestionHistoryInsert {
  id?: string;
  projectId: string;
  prdVersionId?: string | null;
  structuredQuestion: string;
  availableOptions?: unknown | null;
  founderAnswer?: string | null;
  optionalComment?: string | null;
  aiInterpretation?: string | null;
  prdImpact?: string | null;
  questionType?: string;
  createdAt?: Date;
}

// ShareLink insert type
export interface ShareLinkInsert {
  id?: string;
  prdVersionId: string;
  token: string;
  enabled?: boolean;
  createdAt?: Date;
  disabledAt?: Date | null;
}

// ShareLink update type
export interface ShareLinkUpdate {
  enabled?: boolean;
  disabledAt?: Date | null;
}

// Purchase insert type
export interface PurchaseInsert {
  id?: string;
  userId: string;
  packSize: number;
  amountEur: number;
  stripePaymentIntentId?: string | null;
  stripeSessionId?: string | null;
  status?: string;
  createdAt?: Date;
}

// Purchase update type
export interface PurchaseUpdate {
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  status?: string;
}

// FeatureSplit insert type
export interface NewFeatureSplitRow {
  id?: string;
  projectId: string;
  sourcePrdVersionId: string;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// FeatureSplit update type
export interface FeatureSplitUpdate {
  status?: string;
  updatedAt?: Date;
}

// FeatureSplitCluster insert type
export interface NewFeatureSplitClusterRow {
  id?: string;
  featureSplitId: string;
  sortOrder: number;
  label: string;
  valueLine: string;
  boundaryCue: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// MilestoneFeedback insert type
export interface MilestoneFeedbackInsert {
  id?: string;
  userId: string;
  projectId: string;
  prdVersionId?: string | null;
  milestoneType: string;
  ratingType?: string;
  ratingValue?: number | null;
  comment?: string | null;
  createdAt?: Date;
}

export interface NewUserStoryCorpusRow {
  id?: string;
  projectId: string;
  featureSplitClusterId: string;
  reviewReadyAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserStoryCorpusUpdate {
  reviewReadyAt?: Date | null;
  updatedAt?: Date;
}

export interface NewUserStoryLineRow {
  id?: string;
  corpusId: string;
  sortOrder: number;
  title: string;
  body: string;
  archivedAt?: Date | null;
  draftMarker?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserStoryLineUpdate {
  sortOrder?: number;
  title?: string;
  body?: string;
  archivedAt?: Date | null;
  draftMarker?: string | null;
  updatedAt?: Date;
}
