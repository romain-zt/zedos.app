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
  marketingConsent?: boolean;
  productUpdatesConsent?: boolean;
  consentUpdatedAt?: Date | null;
  planTier?: string;
  hasAttemptedExport?: boolean;
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
  marketingConsent?: boolean;
  productUpdatesConsent?: boolean;
  consentUpdatedAt?: Date | null;
  planTier?: string;
  hasAttemptedExport?: boolean;
}

// Project insert type
export interface NewProjectRow {
  id?: string;
  userId: string;
  name: string;
  description?: string | null;
  phase?: string;
  journeyMode?: string;
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
  journeyMode?: string;
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
  deliverableKind?: string;
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

export interface NewTaskSplitBundleRow {
  id?: string;
  projectId: string;
  userStoryLineId?: string | null;
  storyTitle?: string | null;
  storyBody?: string | null;
  lockedAt?: Date | null;
  createdAt?: Date;
  updatedAt: Date;
}

export interface TaskSplitBundleUpdate {
  userStoryLineId?: string | null;
  storyTitle?: string | null;
  storyBody?: string | null;
  lockedAt?: Date | null;
  updatedAt?: Date;
}

/** Explicit insert row — Drizzle $inferInsert does not resolve across package boundaries. */
export interface DecisionGraphInsertRow {
  id?: string;
  projectId: string;
  prdVersionId?: string | null;
  questionHistoryId: string;
  structuredQuestion: string;
  chosenOption?: string | null;
  rejectedOptions?: string[];
  ownerComment?: string | null;
  aiInterpretation?: string | null;
  createdAt?: Date;
}

export interface DecisionGraphLinkInsertRow {
  id?: string;
  decisionId: string;
  sectionId: string;
  anchor?: string | null;
  createdAt?: Date;
}

/** Insert row for project_comment_threads. */
export interface NewCommentThreadRow {
  id?: string;
  projectId: string;
  prdVersionId?: string | null;
  sectionId: string;
  status?: string;
  createdByUserId: string;
  createdAt?: Date;
  resolvedAt?: Date | null;
  ownerLastReadAt?: Date | null;
}

/** Update row for project_comment_threads. */
export interface CommentThreadUpdate {
  status?: string;
  resolvedAt?: Date | null;
  ownerLastReadAt?: Date | null;
}

/** Insert row for project_comment_messages. */
export interface NewCommentMessageRow {
  id?: string;
  threadId: string;
  authorUserId: string;
  body: string;
  createdAt?: Date;
}

export interface NewTaskSplitTaskRow {
  id?: string;
  bundleId: string;
  sortOrder: number;
  title: string;
  promptBody: string;
  manual?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt: Date;
}

export interface TaskSplitTaskUpdate {
  sortOrder?: number;
  title?: string;
  promptBody?: string;
  manual?: boolean;
  deletedAt?: Date | null;
  updatedAt?: Date;
}

/** Insert row for github_connections. */
export interface NewGithubConnectionRow {
  id?: string;
  projectId: string;
  connectedByUserId: string;
  ownerLogin: string;
  repoName: string;
  installationId?: string | null;
  status?: string;
  createdAt?: Date;
  disconnectedAt?: Date | null;
}

export interface GithubConnectionUpdate {
  status?: string;
  installationId?: string | null;
  disconnectedAt?: Date | null;
}

/** Insert row for drift_signals. */
export interface NewDriftSignalRow {
  id?: string;
  projectId: string;
  kind: string;
  severity?: string;
  summary: string;
  payload?: Record<string, unknown>;
  source: string;
  externalDeliveryId: string;
  status?: string;
  createdAt?: Date;
  resolvedAt?: Date | null;
  dismissedAt?: Date | null;
}

export interface DriftSignalUpdate {
  status?: string;
  resolvedAt?: Date | null;
  dismissedAt?: Date | null;
}

/** Insert row for linear_connections. */
export interface NewLinearConnectionRow {
  id?: string;
  projectId: string;
  connectedByUserId: string;
  teamId: string;
  linearProjectId?: string | null;
  status?: string;
  createdAt?: Date;
  disconnectedAt?: Date | null;
}

export interface LinearConnectionUpdate {
  status?: string;
  linearProjectId?: string | null;
  disconnectedAt?: Date | null;
}

/** Insert row for linear_issue_links. */
export interface NewLinearIssueLinkRow {
  id?: string;
  projectId: string;
  userStoryLineId: string;
  linearIssueId: string;
  linearIssueIdentifier: string;
  status?: string;
  lastSyncedAt?: Date | null;
  createdAt?: Date;
}

export interface LinearIssueLinkUpdate {
  status?: string;
  lastSyncedAt?: Date | null;
}

/** Insert row for subscriptions. */
export interface NewSubscriptionRow {
  id?: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  planTier: string;
  status: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: Date | null;
  endedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubscriptionUpdate {
  stripePriceId?: string;
  planTier?: string;
  status?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: Date | null;
  endedAt?: Date | null;
  updatedAt?: Date;
}

/** Insert row for data_room_bundles. */
export interface NewDataRoomBundleRow {
  id?: string;
  projectId: string;
  generatedByUserId: string;
  fileCount: number;
  byteSize: number;
  manifestJson: string;
  createdAt?: Date;
}

/** Insert row for red_team_reports. */
export interface NewRedTeamReportRow {
  id?: string;
  projectId: string;
  prdVersionId: string;
  requestedByUserId: string;
  status?: string;
  creditCost: number;
  findingCount?: number;
  errorMessage?: string | null;
  createdAt?: Date;
  completedAt?: Date | null;
}

export interface RedTeamReportUpdate {
  status?: string;
  findingCount?: number;
  errorMessage?: string | null;
  completedAt?: Date | null;
}

/** Insert row for red_team_findings. */
export interface NewRedTeamFindingRow {
  id?: string;
  reportId: string;
  sortOrder: number;
  category: string;
  severity: string;
  sectionId?: string | null;
  title: string;
  evidence: string;
  suggestion: string;
  metadata?: Record<string, string>;
  createdAt?: Date;
}

/** Insert row for agent_activities (AI team feed). */
export interface NewAgentActivityRow {
  id?: string;
  projectId: string;
  agentRole: string;
  kind: string;
  status?: string;
  summary: string;
  payload?: unknown;
  createdAt?: Date;
  completedAt?: Date | null;
}

/** Update shape for agent_activities. */
export interface AgentActivityUpdate {
  status?: string;
  summary?: string;
  completedAt?: Date | null;
}

/** Insert row for team_plans (Scout's team & skills plan). */
export interface NewTeamPlanRow {
  id?: string;
  projectId: string;
  plan: unknown;
  createdAt?: Date;
  updatedAt: Date;
}

/** Update shape for team_plans. */
export interface TeamPlanUpdate {
  plan?: unknown;
  updatedAt?: Date;
}

/** Insert row for milestones (planning / calendar). */
export interface NewMilestoneRow {
  id?: string;
  projectId: string;
  title: string;
  description?: string | null;
  startsOn?: string | null;
  dueOn?: string | null;
  color?: string | null;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt: Date;
}

/** Update shape for milestones. */
export interface MilestoneUpdate {
  title?: string;
  description?: string | null;
  startsOn?: string | null;
  dueOn?: string | null;
  color?: string | null;
  sortOrder?: number;
  updatedAt?: Date;
}

/** Insert row for tickets (project Kanban board). */
export interface NewTicketRow {
  id?: string;
  projectId: string;
  number: number;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  estimate?: number | null;
  assigneeRole?: string | null;
  userStoryLineId?: string | null;
  taskSplitTaskId?: string | null;
  milestoneId?: string | null;
  dueDate?: string | null;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt: Date;
}

/** Update shape for tickets. */
export interface TicketUpdate {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  estimate?: number | null;
  assigneeRole?: string | null;
  milestoneId?: string | null;
  dueDate?: string | null;
  sortOrder?: number;
  updatedAt?: Date;
}
