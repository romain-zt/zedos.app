'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FadeIn } from '@/components/ui/animate';
import { Layers, Plus, Trash2, Wand2, CheckCircle, ArrowLeft } from 'lucide-react';
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

export function FeatureSplitWorkspace({ projectId, projectName }: FeatureSplitWorkspaceProps) {
  const [prdVersions, setPrdVersions] = useState<PrdVersionDTO[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [split, setSplit] = useState<FeatureSplitDTO | null>(null);
  const [clusters, setClusters] = useState<ClusterDraft[]>([emptyCluster(0)]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [confirming, setConfirming] = useState(false);

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

  const handlePropose = async () => {
    if (!selectedVersionId) return;
    setProposing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/feature-split/propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePrdVersionId: selectedVersionId }),
      });
      const raw = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          toast.error('Insufficient credits for AI proposal');
        } else {
          toast.error(raw?.error ?? 'AI proposal failed');
        }
        return;
      }
      const parsed = ProposeFeatureSplitResponseSchema.safeParse(raw);
      if (!parsed.success) {
        toast.error('Unexpected response from AI');
        return;
      }
      const proposal = parsed.data.proposal;
      setClusters(
        proposal.clusters.map((c) => ({
          sortOrder: c.sortOrder,
          label: c.label,
          valueLine: c.valueLine,
          boundaryCue: c.boundaryCue,
        }))
      );
      toast.success('AI proposal loaded — review and save as draft');
    } catch {
      toast.error('Network error during AI proposal');
    } finally {
      setProposing(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedVersionId) return;
    const validClusters = clusters.filter(
      (c) => c.label.trim() && c.valueLine.trim() && c.boundaryCue.trim()
    );
    if (validClusters.length === 0) {
      toast.error('Add at least one complete cluster before saving');
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
        toast.error(raw?.error ?? 'Failed to save draft');
        return;
      }
      const parsed = FeatureSplitDTOSchema.safeParse(raw);
      if (!parsed.success) {
        toast.error('Unexpected response');
        return;
      }
      setSplit(parsed.data);
      toast.success('Draft saved');
    } catch {
      toast.error('Network error while saving');
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
        toast.error(raw?.error ?? 'Failed to confirm');
        return;
      }
      const parsed = FeatureSplitDTOSchema.safeParse(raw);
      if (parsed.success) setSplit(parsed.data);
      toast.success('Feature split confirmed');
    } catch {
      toast.error('Network error while confirming');
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
            Back to {projectName}
          </Link>
          <div className="flex items-center gap-3">
            <Layers className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">Feature Split</h1>
              <p className="text-sm text-muted-foreground">
                Break your PRD into independently deliverable clusters.
              </p>
            </div>
          </div>
        </div>

        {/* PRD version picker */}
        {prdVersions.length > 1 && (
          <div className="mb-4">
            <label className="text-sm font-medium mb-1 block">PRD version</label>
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
                  Confirmed
                </>
              ) : (
                'Draft'
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              {split.clusters.length} cluster{split.clusters.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-12 text-center text-muted-foreground text-sm">Loading…</div>
        )}

        {!loading && (
          <FadeIn>
            {/* Actions */}
            {!isConfirmed && (
              <div className="flex flex-wrap gap-2 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePropose}
                  disabled={proposing || !selectedVersionId}
                >
                  <Wand2 className="h-4 w-4 mr-1" />
                  {proposing ? 'Generating…' : 'AI propose'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddCluster}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add cluster
                </Button>
              </div>
            )}

            {/* Cluster list */}
            <div className="space-y-4">
              {clusters.map((cluster, index) => (
                <div
                  key={index}
                  className="border border-border rounded-lg p-4 space-y-3 bg-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Cluster {index + 1}
                    </span>
                    {!isConfirmed && clusters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCluster(index)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        aria-label="Remove cluster"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1 block">Name</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
                      placeholder="e.g. Payments"
                      value={cluster.label}
                      onChange={(e) => handleClusterChange(index, 'label', e.target.value)}
                      disabled={isConfirmed}
                      maxLength={500}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1 block">Value</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
                      placeholder="What user value does this cluster deliver?"
                      value={cluster.valueLine}
                      onChange={(e) => handleClusterChange(index, 'valueLine', e.target.value)}
                      disabled={isConfirmed}
                      maxLength={2000}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1 block">Boundary</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
                      placeholder="What does this cluster NOT include?"
                      value={cluster.boundaryCue}
                      onChange={(e) => handleClusterChange(index, 'boundaryCue', e.target.value)}
                      disabled={isConfirmed}
                      maxLength={2000}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Footer actions */}
            {!isConfirmed && (
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="flex-1 sm:flex-none"
                >
                  {saving ? 'Saving…' : 'Save draft'}
                </Button>
                {split && (
                  <Button
                    variant="default"
                    onClick={handleConfirm}
                    disabled={confirming}
                    className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {confirming ? 'Confirming…' : 'Confirm split'}
                  </Button>
                )}
              </div>
            )}

            {isConfirmed && (
              <div className="mt-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                  Feature split confirmed. The next step is generating user stories from these clusters.
                </p>
                <Button variant="outline" size="sm" className="mt-3 min-h-11 w-full sm:w-auto" asChild>
                  <Link href={`/dashboard/projects/${projectId}/user-stories`}>Open user stories</Link>
                </Button>
              </div>
            )}
          </FadeIn>
        )}
      </div>
    </div>
  );
}
