export type DriftSignalKind = 'DRIFT-01' | 'DRIFT-02' | 'DRIFT-03' | 'DRIFT-04';
export type DriftSignalSeverity = 'info' | 'warn' | 'critical';
export type DriftSignalSource = 'webhook' | 'scheduled' | 'backfill';
export type DriftSignalStatus = 'open' | 'resolved' | 'dismissed';

export interface DriftSignal {
  readonly id: string;
  readonly projectId: string;
  readonly kind: DriftSignalKind;
  readonly severity: DriftSignalSeverity;
  readonly summary: string;
  readonly payload: Record<string, unknown>;
  readonly source: DriftSignalSource;
  readonly externalDeliveryId: string;
  readonly status: DriftSignalStatus;
  readonly createdAt: Date;
  readonly resolvedAt: Date | null;
  readonly dismissedAt: Date | null;
}

export interface DriftSignalDraft {
  readonly projectId: string;
  readonly kind: DriftSignalKind;
  readonly severity: DriftSignalSeverity;
  readonly summary: string;
  readonly payload: Record<string, unknown>;
  readonly source: DriftSignalSource;
  readonly externalDeliveryId: string;
}
