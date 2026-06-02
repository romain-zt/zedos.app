'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FadeIn } from '@/components/ui/animate';
import { Layers, Plus, Trash2, Wand2, CheckCircle, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  FeatureSplitListResponseSchema,
  FeatureSplitDTOSchema,
  type FeatureCluster,
  type FeatureSplitDTO,
} from '@repo/contracts/feature-split/feature-split';
import {
  PrdVersionListResponseSchema,
  type PrdVersionDTO,
} from '@repo/contracts/prd/prd-contracts';
import { ProposeFeatureSplitResponseSchema } from '@repo/contracts/ai/feature-split-proposal';
import {
  assessPrdSplitReadiness,
  buildTemplateClustersFromPrd,
} from '@/lib/prd-content-for-ai';
import { useI18n } from '@/src/i18n';

interface FeatureSplitWorkspaceProps {
  projectId: string;
  projectName: string;
}

interface ClusterDraft {
  sortOrder: number;
  label: string;
  valueLine: string;
  boundaryCue: string;
}

function emptyCluster(sortOrder: number): ClusterDraft {
  return { sortOrder, label: '', valueLine: '', boundaryCue: '' };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const PROPOSAL_STATUS_MESSAGES = [
  'Reading PRD sections…',
  'Identifying deliverable areas…',
  'Drafting cluster boundaries…',
] as const;

export function FeatureSplitWorkspace({ projectId, projectName }: FeatureSplitWorkspaceProps) {
  const { t } = useI18n();
  const [prdVersions, setPrdVersions] = useState<PrdVersionDTO[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [split, setSplit] = useState<FeatureSplitDTO | null>(null);
  const [clusters, setClusters] = useState<ClusterDraft[]>([emptyCluster(0)]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [buildingTemplate, setBuildingTemplate] = useState(false);
  const [proposalStatus, setProposalStatus] = useState<string | null>(null);
  const [revealedClusterCount, setRevealedClusterCount] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);

  const selectedVersion = useMemo(
    () => prdVersions.find((version) => version.id === selectedVersionId) ?? null,
    [prdVersions, selectedVersionId]
  );

  const prdReadiness = useMemo(
    () => (selectedVersion?.content ? assessPrdSplitReadiness(selectedVersion.content) : null),
    [selectedVersion]
  );

  const fetchVersions = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/prd`);
      if (!res.ok) return;
      const raw = await res.json();
      const parsed = PrdVersionListResponseSchema.safeParse(raw);
      if (!parsed.success) return;
      setPrdVersions(parsed.data);
      if (parsed.data.length > 0 && !selectedVersionId) {
        setSelectedVersionId(parsed.data[0].id);
      }
    } catch {
      // silent
    }
  }, [projectId, selectedVersionId]);

  const fetchSplit = useCallback(
    async (prdVersionId: string) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/projects/${projectId}/feature-split?sourcePrdVersionId=${encodeURIComponent(prdVersionId)}`
        );
        if (!res.ok) {
          setSplit(null);
          setClusters([emptyCluster(0)]);
          return;
        }
        const raw = await res.json();
        const parsed = FeatureSplitListResponseSchema.safeParse(raw);
        if (!parsed.success || parsed.data.length === 0) {
          setSplit(null);
          setClusters([emptyCluster(0)]);
          return;
        }
        const existing = parsed.data[0];
        setSplit(existing);
        setClusters(
          existing.clusters.length > 0
            ? existing.clusters.map((c: FeatureCluster) => ({
                sortOrder: c.sortOrder,
                label: c.label,
                valueLine: c.valueLine,
                boundaryCue: c.boundaryCue,
              }))
            : [emptyCluster(0)]
        );
      } catch {
        setSplit(null);
      } finally {
        setLoading(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  useEffect(() => {
    if (selectedVersionId) {
      fetchSplit(selectedVersionId);
    }
  }, [selectedVersionId, fetchSplit]);

  const handleAddCluster = () => {
    setClusters((prev) => [...prev, emptyCluster(prev.length)]);
  };

  const handleRemoveCluster = (index: number) => {
    setClusters((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((c, i) => ({ ...c, sortOrder: i }))
    );
  };

  const handleClusterChange = (
    index: number,
    field: keyof ClusterDraft,
    value: string | number
  ) => {
    setClusters((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const revealClustersSequentially = async (nextClusters: ClusterDraft[]) => {
    setClusters([]);
    setRevealedClusterCount(0);

    for (let index = 0; index < nextClusters.length; index++) {
      setProposalStatus(`Cluster ${index + 1} of ${nextClusters.length} ready`);
      await sleep(220);
      setClusters((prev) => [...prev, nextClusters[index]]);
      setRevealedClusterCount(index + 1);
    }

    setProposalStatus(null);
    setRevealedClusterCount(null);
  };

  const handleBuildFromSections = async () => {
    if (!selectedVersion?.content) {
      toast.error(t('featureSplit.noPrdContent'));
      return;
    }

    const template = buildTemplateClustersFromPrd(selectedVersion.content);
    if (template.length === 0) {
      toast.error(t('featureSplit.noFilledSections'));
      return;
    }

    setBuildingTemplate(true);
    try {
      await revealClustersSequentially(template);
      toast.success(t('featureSplit.clustersLoaded').replace('{count}', String(template.length)));
    } finally {
      setBuildingTemplate(false);
    }
  };

  const handlePropose = async () => {
    if (!selectedVersionId) return;

    if (prdReadiness && !prdReadiness.isReadyForAiSplit) {
      toast.error(prdReadiness.message);
      return;
    }

    setProposing(true);
    setProposalStatus(PROPOSAL_STATUS_MESSAGES[0]);
    const statusTimer = window.setInterval(() => {
      setProposalStatus((current) => {
        const index = PROPOSAL_STATUS_MESSAGES.indexOf(
          (current ?? PROPOSAL_STATUS_MESSAGES[0]) as (typeof PROPOSAL_STATUS_MESSAGES)[number]
        );
        const nextIndex = index < 0 ? 0 : (index + 1) % PROPOSAL_STATUS_MESSAGES.length;
        return PROPOSAL_STATUS_MESSAGES[nextIndex];
      });
    }, 2500);

    try {
      const res = await fetch(`/api/projects/${projectId}/feature-split/propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePrdVersionId: selectedVersionId }),
      });
      const raw = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          toast.error(t('featureSplit.insufficientCredits'));
        } else if (res.status === 504) {
          toast.error(t('featureSplit.aiTimeout'));
        } else if (res.status === 503) {
          toast.error(t('featureSplit.aiProviderNotConfigured'));
        } else if (res.status === 400 || res.status === 422) {
          toast.error(raw?.error ?? t('featureSplit.prdNotReady'));
        } else {
          toast.error(raw?.error ?? t('featureSplit.aiProposalFailed'));
        }
        return;
      }
      const parsed = ProposeFeatureSplitResponseSchema.safeParse(raw);
      if (!parsed.success) {
        toast.error(t('common.unexpectedResponse'));
        return;
      }
      const proposal = parsed.data.proposal;
      const mapped = proposal.clusters.map((cluster) => ({
        sortOrder: cluster.sortOrder,
        label: cluster.label,
        valueLine: cluster.valueLine,
        boundaryCue: cluster.boundaryCue,
      }));
      await revealClustersSequentially(mapped);
      toast.success(t('featureSplit.aiProposalLoaded'));
    } catch {
      toast.error(t('featureSplit.networkErrorAiProposal'));
    } finally {
      window.clearInterval(statusTimer);
      setProposalStatus(null);
      setProposing(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedVersionId) return;
    const validClusters = clusters.filter(
      (c) => c.label.trim() && c.valueLine.trim() && c.boundaryCue.trim()
    );
    if (validClusters.length === 0) {
      toast.error(t('featureSplit.addCompleteCluster'));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/feature-split`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourcePrdVersionId: selectedVersionId,
          clusters: validClusters,
        }),
      });
      const raw = await res.json();
      if (!res.ok) {
        toast.error(raw?.error ?? t('featureSplit.saveDraftFailed'));
        return;
      }
      const parsed = FeatureSplitDTOSchema.safeParse(raw);
      if (!parsed.success) {
        toast.error(t('common.unexpectedResponse'));
        return;
      }
      setSplit(parsed.data);
      toast.success(t('featureSplit.draftSaved'));
    } catch {
      toast.error(t('featureSplit.networkErrorSaving'));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!split) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/feature-split/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureSplitId: split.id }),
      });
      const raw = await res.json();
      if (!res.ok) {
        toast.error(raw?.error ?? t('featureSplit.confirmFailed'));
        return;
      }
      const parsed = FeatureSplitDTOSchema.safeParse(raw);
      if (parsed.success) setSplit(parsed.data);
      toast.success(t('featureSplit.confirmed'));
    } catch {
      toast.error(t('featureSplit.networkErrorConfirming'));
    } finally {
      setConfirming(false);
    }
  };

  const isConfirmed = split?.status === 'confirmed';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.backTo')} {projectName}
          </Link>
          <div className="flex items-center gap-3">
            <Layers className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">{t('projectNav.featureSplit')}</h1>
              <p className="text-sm text-muted-foreground">
                {t('featureSplit.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* PRD version picker */}
        {prdVersions.length > 1 && (
          <div className="mb-4">
            <label className="text-sm font-medium mb-1 block">{t('prd.version')}</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedVersionId ?? ''}
              onChange={(e) => setSelectedVersionId(e.target.value)}
            >
              {prdVersions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.versionNumber}
                  {v.status ? ` — ${v.status}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status badge */}
        {split && (
          <div className="mb-4 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                isConfirmed
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
              }`}
            >
              {isConfirmed ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  {t('featureSplit.statusConfirmed')}
                </>
              ) : (
                t('featureSplit.statusDraft')
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              {split.clusters.length} {t('featureSplit.clusterWord')}{split.clusters.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-12 text-center text-muted-foreground text-sm">{t('common.loading')}</div>
        )}

        {!loading && (
          <FadeIn>
            {prdReadiness && !prdReadiness.isReadyForAiSplit && (
              <div className="mb-6 rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                <p className="font-medium text-foreground">{t('featureSplit.prdNotReadyTitle')}</p>
                <p className="text-muted-foreground mt-1">{prdReadiness.message}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm" className="min-h-[44px]">
                    <Link href={`/dashboard/projects/${projectId}`}>{t('featureSplit.openWorkspace')}</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="min-h-[44px]"
                    disabled={buildingTemplate}
                    onClick={() => void handleBuildFromSections()}
                  >
                    {buildingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    <span className="ml-2">{t('featureSplit.fromPrdSections')}</span>
                  </Button>
                </div>
              </div>
            )}

            {(proposing || buildingTemplate || proposalStatus) && (
              <div className="mb-6 rounded-md border bg-muted/30 p-4 text-sm flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin shrink-0 text-primary" />
                <span>{proposalStatus ?? t('featureSplit.preparingClusters')}</span>
              </div>
            )}

            {/* Actions */}
            {!isConfirmed && (
              <div className="flex flex-wrap gap-2 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handlePropose()}
                  disabled={proposing || buildingTemplate || !selectedVersionId || !prdReadiness?.isReadyForAiSplit}
                >
                  <Wand2 className="h-4 w-4 mr-1" />
                  {proposing ? t('common.generating') : t('featureSplit.aiPropose')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleBuildFromSections()}
                  disabled={proposing || buildingTemplate || !selectedVersion?.content}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  {buildingTemplate ? t('common.building') : t('featureSplit.fromPrdSections')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddCluster}
                  disabled={proposing || buildingTemplate}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('featureSplit.addCluster')}
                </Button>
              </div>
            )}

            {/* Cluster list */}
            <div className="space-y-4">
              {clusters.map((cluster, index) => {
                const isRevealing =
                  revealedClusterCount != null && index === revealedClusterCount - 1;
                return (
                <div
                  key={`${cluster.sortOrder}-${index}`}
                  className={`border border-border rounded-lg p-4 space-y-3 bg-card transition-all duration-300 ${
                    isRevealing ? 'ring-2 ring-primary/30' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t('featureSplit.clusterWord')} {index + 1}
                    </span>
                    {!isConfirmed && clusters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCluster(index)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        aria-label={t('featureSplit.removeCluster')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1 block">{t('common.name')}</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
                      placeholder={t('featureSplit.namePlaceholder')}
                      value={cluster.label}
                      onChange={(e) => handleClusterChange(index, 'label', e.target.value)}
                      disabled={isConfirmed}
                      maxLength={500}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1 block">{t('featureSplit.value')}</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
                      placeholder={t('featureSplit.valuePlaceholder')}
                      value={cluster.valueLine}
                      onChange={(e) => handleClusterChange(index, 'valueLine', e.target.value)}
                      disabled={isConfirmed}
                      maxLength={2000}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1 block">{t('featureSplit.boundary')}</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
                      placeholder={t('featureSplit.boundaryPlaceholder')}
                      value={cluster.boundaryCue}
                      onChange={(e) => handleClusterChange(index, 'boundaryCue', e.target.value)}
                      disabled={isConfirmed}
                      maxLength={2000}
                    />
                  </div>
                </div>
                );
              })}
            </div>

            {/* Footer actions */}
            {!isConfirmed && (
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="flex-1 sm:flex-none"
                >
                  {saving ? t('common.saving') : t('featureSplit.saveDraft')}
                </Button>
                {split && (
                  <Button
                    variant="default"
                    onClick={handleConfirm}
                    disabled={confirming}
                    className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {confirming ? t('featureSplit.confirming') : t('featureSplit.confirmSplit')}
                  </Button>
                )}
              </div>
            )}

            {isConfirmed && (
              <div className="mt-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 space-y-3">
                <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                  {t('featureSplit.confirmedNextStep')}
                </p>
                <Button asChild className="min-h-[44px] w-full sm:w-auto">
                  <Link href={`/dashboard/projects/${projectId}/user-stories`}>{t('featureSplit.generateUserStories')}</Link>
                </Button>
              </div>
            )}
          </FadeIn>
        )}
      </div>
    </div>
  );
}
