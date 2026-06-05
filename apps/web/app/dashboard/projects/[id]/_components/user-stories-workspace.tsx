'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/animate';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ListChecks,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import {
  FeatureSplitListResponseSchema,
  type FeatureCluster,
  type FeatureSplitDTO,
} from '@repo/contracts/feature-split/feature-split';
import { PrdVersionListResponseSchema, type PrdVersionDTO } from '@repo/contracts/prd/prd-contracts';
import { GenerateUserStoriesResponseSchema } from '@repo/contracts/user-stories';
import { UserStoryCorpusSchema, type UserStoryCorpusDTO } from '@repo/contracts/user-stories';
import { useI18n } from '@/src/i18n';

interface UserStoriesWorkspaceProps {
  projectId: string;
  projectName: string;
}

type LineDraft = {
  id?: string;
  sortOrder: number;
  title: string;
  body: string;
  archivedAt?: string | null;
  draftMarker?: string | null;
};

function emptyLine(sortOrder: number): LineDraft {
  return { sortOrder, title: '', body: '' };
}

function confirmedSplitForVersion(splits: FeatureSplitDTO[], prdVersionId: string): FeatureSplitDTO | null {
  const match = splits.find((s) => s.status === 'confirmed' && s.sourcePrdVersionId === prdVersionId);
  return match ?? null;
}

function mapCorpusLine(l: UserStoryCorpusDTO['lines'][number]): LineDraft {
  return {
    id: l.id,
    sortOrder: l.sortOrder,
    title: l.title,
    body: l.body,
    archivedAt: l.archivedAt ? l.archivedAt.toISOString() : null,
    draftMarker: l.draftMarker,
  };
}

function splitCorpusLines(corpus: UserStoryCorpusDTO): { active: LineDraft[]; archived: LineDraft[] } {
  const sorted = [...corpus.lines].sort((a, b) => a.sortOrder - b.sortOrder);
  const active = sorted.filter((l) => !l.archivedAt).map(mapCorpusLine);
  const archived = sorted.filter((l) => l.archivedAt).map(mapCorpusLine);
  return { active, archived };
}

function corpusToDrafts(corpus: UserStoryCorpusDTO): LineDraft[] {
  return splitCorpusLines(corpus).active;
}

export function UserStoriesWorkspace({ projectId, projectName }: UserStoriesWorkspaceProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [prdVersions, setPrdVersions] = useState<PrdVersionDTO[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [splits, setSplits] = useState<FeatureSplitDTO[]>([]);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [archivedLines, setArchivedLines] = useState<LineDraft[]>([]);
  const [reviewReadyAt, setReviewReadyAt] = useState<Date | null>(null);
  const generationAbortRef = useRef<AbortController | null>(null);
  const [hasPersistedCorpus, setHasPersistedCorpus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingCorpus, setLoadingCorpus] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingTemplate, setGeneratingTemplate] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [markingReady, setMarkingReady] = useState(false);
  /** When non-empty, template / AI actions run for these clusters (sequential). When empty, actions use `selectedClusterId` only. */
  const [batchClusterIds, setBatchClusterIds] = useState<string[]>([]);
  const [clustersWithCorpus, setClustersWithCorpus] = useState<Set<string>>(() => new Set());

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
      // network
    }
  }, [projectId, selectedVersionId]);

  const fetchSplitsForVersion = useCallback(
    async (prdVersionId: string) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/projects/${projectId}/feature-split?sourcePrdVersionId=${encodeURIComponent(prdVersionId)}`
        );
        if (!res.ok) {
          setSplits([]);
          return;
        }
        const raw = await res.json();
        const parsed = FeatureSplitListResponseSchema.safeParse(raw);
        if (!parsed.success) {
          setSplits([]);
        } else {
          setSplits(parsed.data);
        }
      } catch {
        setSplits([]);
      } finally {
        setLoading(false);
      }
    },
    [projectId]
  );

  const markClusterHasCorpus = useCallback((clusterId: string, hasCorpus: boolean) => {
    setClustersWithCorpus((prev) => {
      const next = new Set(prev);
      if (hasCorpus) next.add(clusterId);
      else next.delete(clusterId);
      return next;
    });
  }, []);

  const refreshCorpusFlags = useCallback(
    async (clusterIds: string[]) => {
      if (clusterIds.length === 0) return;
      const flags = await Promise.all(
        clusterIds.map(async (clusterId) => {
          try {
            const res = await fetch(
              `/api/projects/${projectId}/user-stories?featureSplitClusterId=${encodeURIComponent(clusterId)}`
            );
            return { clusterId, hasCorpus: res.ok };
          } catch {
            return { clusterId, hasCorpus: false };
          }
        })
      );
      setClustersWithCorpus((prev) => {
        const next = new Set(prev);
        for (const { clusterId, hasCorpus } of flags) {
          if (hasCorpus) next.add(clusterId);
          else next.delete(clusterId);
        }
        return next;
      });
    },
    [projectId]
  );

  const fetchCorpus = useCallback(
    async (clusterId: string) => {
      setLoadingCorpus(true);
      try {
        const res = await fetch(
          `/api/projects/${projectId}/user-stories?featureSplitClusterId=${encodeURIComponent(clusterId)}`
        );
        if (res.status === 404) {
          setLines([emptyLine(0)]);
          setArchivedLines([]);
          setReviewReadyAt(null);
          setHasPersistedCorpus(false);
          markClusterHasCorpus(clusterId, false);
          return;
        }
        if (!res.ok) {
          toast.error(t('userStories.loadFailed'));
          return;
        }
        const raw = await res.json();
        const parsed = UserStoryCorpusSchema.safeParse(raw);
        if (!parsed.success) {
          toast.error(t('userStories.unexpectedCorpusResponse'));
          return;
        }
        const corpus = parsed.data;
        const { active, archived } = splitCorpusLines(corpus);
        setReviewReadyAt(corpus.reviewReadyAt);
        setHasPersistedCorpus(true);
        markClusterHasCorpus(clusterId, true);
        setArchivedLines(archived);
        setLines(active.length > 0 ? active : [emptyLine(0)]);
      } catch {
        toast.error(t('userStories.networkLoadError'));
      } finally {
        setLoadingCorpus(false);
      }
    },
    [projectId, markClusterHasCorpus, t]
  );

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  useEffect(() => {
    if (selectedVersionId) {
      setSelectedClusterId(null);
      setBatchClusterIds([]);
      setLines([]);
      setArchivedLines([]);
      fetchSplitsForVersion(selectedVersionId);
    }
  }, [selectedVersionId, fetchSplitsForVersion]);

  useEffect(() => {
    if (selectedClusterId) {
      fetchCorpus(selectedClusterId);
    }
  }, [selectedClusterId, fetchCorpus]);

  const confirmed = selectedVersionId ? confirmedSplitForVersion(splits, selectedVersionId) : null;
  const clusters = useMemo<FeatureCluster[]>(
    () => confirmed?.clusters ?? [],
    [confirmed?.clusters]
  );

  const batchSet = useMemo(() => new Set(batchClusterIds), [batchClusterIds]);

  const generationTargetCount = useMemo(() => {
    if (batchClusterIds.length > 0) return batchClusterIds.length;
    if (selectedClusterId) return 1;
    return 0;
  }, [batchClusterIds, selectedClusterId]);

  useEffect(() => {
    if (clusters.length > 0) {
      void refreshCorpusFlags(clusters.map((c) => c.id));
    }
  }, [clusters, refreshCorpusFlags]);

  const toggleBatchCluster = (clusterId: string) => {
    setBatchClusterIds((prev) =>
      prev.includes(clusterId) ? prev.filter((id) => id !== clusterId) : [...prev, clusterId]
    );
  };

  const selectAllClustersForBatch = () => {
    setBatchClusterIds(clusters.map((c) => c.id));
  };

  const clearBatchClusters = () => {
    setBatchClusterIds([]);
  };

  const generationTargets = (): string[] => {
    if (batchClusterIds.length > 0) return batchClusterIds;
    if (selectedClusterId) return [selectedClusterId];
    return [];
  };

  const handleLineChange = (index: number, field: keyof LineDraft, value: string | number) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
  };

  const handleAddLine = () => {
    setLines((prev) => [...prev, emptyLine(prev.length)]);
  };

  const handleArchiveLine = (index: number) => {
    const line = lines[index];
    if (!line) return;
    const archivedAt = new Date().toISOString();
    setArchivedLines((prev) => [...prev, { ...line, archivedAt }]);
    setLines((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((l, i) => ({ ...l, sortOrder: i }))
    );
  };

  const handleMoveLine = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    setLines((prev) => {
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const current = next[index];
      const swap = next[targetIndex];
      if (!current || !swap) return prev;
      next[index] = { ...swap, sortOrder: index };
      next[targetIndex] = { ...current, sortOrder: targetIndex };
      return next;
    });
  };

  const buildSavePayload = (clusterId: string) => {
    const validActive = lines.filter((l) => l.title.trim() && l.body.trim());
    const mapLine = (l: LineDraft) => ({
      ...(l.id ? { id: l.id } : {}),
      sortOrder: l.sortOrder,
      title: l.title.trim(),
      body: l.body.trim(),
      archivedAt: l.archivedAt ?? null,
      draftMarker: l.draftMarker ?? null,
    });
    return {
      featureSplitClusterId: clusterId,
      lines: [...validActive.map(mapLine), ...archivedLines.map(mapLine)],
    };
  };

  const applyCorpusResponse = (raw: unknown) => {
    const parsed = UserStoryCorpusSchema.safeParse(raw);
    if (!parsed.success) {
      toast.error(t('userStories.unexpectedResponse'));
      return;
    }
    const corpus = parsed.data;
    const { active, archived } = splitCorpusLines(corpus);
    setReviewReadyAt(corpus.reviewReadyAt);
    setHasPersistedCorpus(true);
    setArchivedLines(archived);
    setLines(active.length > 0 ? active : [emptyLine(0)]);
    markClusterHasCorpus(corpus.featureSplitClusterId, true);
  };

  const handleCancelGeneration = () => {
    generationAbortRef.current?.abort();
    generationAbortRef.current = null;
    setGeneratingAi(false);
    toast.dismiss('ai-story-gen');
    toast.info(t('userStories.generationCancelled'));
  };

  const handleSave = async () => {
    if (!selectedClusterId) return;
    const activeCount = lines.filter((l) => l.title.trim() && l.body.trim()).length;
    if (activeCount === 0) {
      toast.error(t('userStories.addOneStoryRequired'));
      return;
    }
    const payload = buildSavePayload(selectedClusterId);
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/user-stories`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const raw = await res.json();
      if (!res.ok) {
        toast.error(raw?.error ?? t('userStories.saveFailed'));
        return;
      }
      applyCorpusResponse(raw);
      toast.success(t('userStories.saved'));
    } catch {
      toast.error(t('userStories.networkSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const generateAiStoriesForCluster = async (
    clusterId: string,
    clusterLabel: string,
    signal: AbortSignal,
    onStoryProgress?: (corpus: UserStoryCorpusDTO) => void
  ): Promise<UserStoryCorpusDTO | null> => {
    const outlineRes = await fetch(`/api/projects/${projectId}/user-stories/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        featureSplitClusterId: clusterId,
        mode: 'ai',
        aiStep: 'outline',
      }),
    });
    const outlineRaw = await outlineRes.json();
    if (!outlineRes.ok) {
      if (outlineRes.status === 402) {
        toast.error(t('userStories.insufficientCreditsAi'));
      } else {
        toast.error(outlineRaw?.error ?? t('userStories.outlineGenerationFailed'));
      }
      return null;
    }
    const outlineParsed = GenerateUserStoriesResponseSchema.safeParse(outlineRaw);
    if (!outlineParsed.success || outlineParsed.data.kind !== 'outline') {
      toast.error(t('userStories.unexpectedOutlineResponse'));
      return null;
    }

    const { outlines, total } = outlineParsed.data;
    let existingLines: { sortOrder: number; title: string; body: string }[] = [];
    let lastCorpus: UserStoryCorpusDTO | null = null;

    for (let storyIndex = 0; storyIndex < outlines.length; storyIndex++) {
      toast.loading(t('userStories.generatingStoryProgress').replace('{index}', String(storyIndex + 1)).replace('{total}', String(total)).replace('{cluster}', clusterLabel), { id: 'ai-story-gen' });
      const storyRes = await fetch(`/api/projects/${projectId}/user-stories/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          featureSplitClusterId: clusterId,
          mode: 'ai',
          aiStep: 'story',
          outlines,
          outlineIndex: storyIndex,
          existingLines,
        }),
      });
      const storyRaw = await storyRes.json();
      if (!storyRes.ok) {
        toast.dismiss('ai-story-gen');
        if (storyRes.status === 402) {
          toast.error(t('userStories.insufficientCreditsAi'));
        } else {
          const partial =
            existingLines.length > 0
              ? ` (${existingLines.length}/${total} stories saved before failure)`
              : '';
          toast.error((storyRaw?.error ?? t('userStories.storyGenerationFailed')) + partial);
        }
        return lastCorpus;
      }
      const storyParsed = GenerateUserStoriesResponseSchema.safeParse(storyRaw);
      if (!storyParsed.success || storyParsed.data.kind !== 'story') {
        toast.dismiss('ai-story-gen');
        toast.error(t('userStories.unexpectedStoryResponse').replace('{index}', String(storyIndex + 1)).replace('{total}', String(total)));
        return lastCorpus;
      }
      lastCorpus = storyParsed.data.corpus;
      existingLines = lastCorpus.lines
        .filter((l) => !l.archivedAt)
        .map((l) => ({
          sortOrder: l.sortOrder,
          title: l.title,
          body: l.body,
        }));
      onStoryProgress?.(lastCorpus);
    }

    toast.dismiss('ai-story-gen');
    return lastCorpus;
  };

  const handleGenerate = async (mode: 'template' | 'ai') => {
    const targets = generationTargets();
    if (targets.length === 0) {
      toast.error(t('userStories.selectClusterForGeneration'));
      return;
    }
    const setBusy = mode === 'template' ? setGeneratingTemplate : setGeneratingAi;
    setBusy(true);
    if (mode === 'ai') {
      generationAbortRef.current?.abort();
      generationAbortRef.current = new AbortController();
    }
    const signal = generationAbortRef.current?.signal;
    try {
      let rawForCurrentView: UserStoryCorpusDTO | null = null;
      const confirmedSplit = selectedVersionId
        ? confirmedSplitForVersion(splits, selectedVersionId)
        : null;
      const clusterById = new Map(
        (confirmedSplit?.clusters ?? []).map((c) => [c.id, c] as const)
      );

      for (let i = 0; i < targets.length; i++) {
        const clusterId = targets[i];
        const clusterLabel = clusterById.get(clusterId)?.label ?? t('userStories.cluster');

        if (mode === 'ai') {
          if (!signal) return;
          const corpus = await generateAiStoriesForCluster(
            clusterId,
            clusterLabel,
            signal,
            selectedClusterId === clusterId ? applyCorpusResponse : undefined
          );
          if (corpus === null) return;
          if (selectedClusterId && clusterId === selectedClusterId) {
            rawForCurrentView = corpus;
          }
          continue;
        }

        const res = await fetch(`/api/projects/${projectId}/user-stories/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featureSplitClusterId: clusterId, mode: 'template' }),
        });
        const raw = await res.json();
        if (!res.ok) {
          toast.error(raw?.error ?? t('userStories.generationFailedCluster').replace('{index}', String(i + 1)).replace('{total}', String(targets.length)));
          return;
        }
        const parsed = GenerateUserStoriesResponseSchema.safeParse(raw);
        if (!parsed.success || parsed.data.kind !== 'corpus') {
          toast.error(t('userStories.unexpectedGenerateResponseCluster').replace('{index}', String(i + 1)).replace('{total}', String(targets.length)));
          return;
        }
        if (selectedClusterId && clusterId === selectedClusterId) {
          rawForCurrentView = parsed.data.corpus;
        }
      }
      if (rawForCurrentView != null) {
        applyCorpusResponse(rawForCurrentView);
      } else if (selectedClusterId && targets.includes(selectedClusterId)) {
        await fetchCorpus(selectedClusterId);
      }

      for (const clusterId of targets) {
        markClusterHasCorpus(clusterId, true);
      }
      const primaryClusterId = selectedClusterId ?? targets[0];

      const batchLabel = targets.length > 1 ? ` (${targets.length} clusters)` : '';
      const successMessage =
        mode === 'template'
          ? `${t('userStories.templateGenerated')}${batchLabel}`
          : `${t('userStories.aiDraftsGenerated')}${batchLabel} — ${t('userStories.reviewAndSave')}`;
      toast.success(successMessage, {
        action: primaryClusterId
          ? {
              label: t('userStories.viewStories'),
              onClick: () =>
                router.push(
                  `/dashboard/projects/${projectId}/user-stories/${primaryClusterId}`
                ),
            }
          : undefined,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      toast.error(t('userStories.networkGenerationError'));
    } finally {
      generationAbortRef.current = null;
      setBusy(false);
    }
  };

  const handleMarkReviewReady = async () => {
    if (!selectedClusterId || !hasPersistedCorpus) return;
    setMarkingReady(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/user-stories/review-ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureSplitClusterId: selectedClusterId }),
      });
      const raw = await res.json();
      if (!res.ok) {
        toast.error(raw?.error ?? t('userStories.markReviewReadyFailed'));
        return;
      }
      applyCorpusResponse(raw);
      toast.success(t('userStories.markedReviewReady'));
    } catch {
      toast.error(t('userStories.networkError'));
    } finally {
      setMarkingReady(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href={`/dashboard/projects/${projectId}`}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2 min-h-[44px] sm:min-h-0"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('workspace.backToWorkspace')}
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                <BookOpen className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 text-primary" />
                {t('userStories.title')}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">{projectName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild className="min-h-[44px]">
                <Link href={`/dashboard/projects/${projectId}/feature-split`}>{t('projectNav.featureSplit')}</Link>
              </Button>
              <Button asChild className="min-h-[44px]">
                <Link href={`/dashboard/projects/${projectId}/task-split`}>
                  <ListChecks className="h-4 w-4" />
                  <span className="ml-2">{t('userStories.splitIntoTasks')}</span>
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4 sm:p-6 space-y-6">
            <div className="space-y-2">
              <label htmlFor="prd-version" className="text-sm font-medium">
                {t('prd.version')}
              </label>
              <select
                id="prd-version"
                className="w-full min-h-[44px] rounded-md border bg-background px-3 py-2 text-base"
                value={selectedVersionId ?? ''}
                onChange={(e) => setSelectedVersionId(e.target.value || null)}
              >
                <option value="" disabled>
                  {t('prd.selectVersion')}
                </option>
                {prdVersions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {`Version ${v.versionNumber}`}
                  </option>
                ))}
              </select>
            </div>

            {!loading && selectedVersionId && !confirmed && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                <p className="font-medium text-foreground">{t('userStories.confirmSplitFirstTitle')}</p>
                <p className="text-muted-foreground mt-1">
                  {t('userStories.confirmSplitFirstDescription')}
                </p>
                <Button asChild className="mt-3 min-h-[44px]">
                  <Link href={`/dashboard/projects/${projectId}/feature-split`}>{t('userStories.openFeatureSplit')}</Link>
                </Button>
              </div>
            )}

            {confirmed && clusters.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-medium">{t('userStories.cluster')}</span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="min-h-[44px]"
                      onClick={selectAllClustersForBatch}
                    >
                      {t('userStories.selectAllForBatch')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="min-h-[44px]"
                      onClick={clearBatchClusters}
                      disabled={batchClusterIds.length === 0}
                    >
                      {t('userStories.clearBatch')}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('userStories.batchHelpText')}
                  {batchClusterIds.length > 0 ? ` (${batchClusterIds.length} selected)` : null}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {clusters.map((c) => {
                    const active = selectedClusterId === c.id;
                    const inBatch = batchSet.has(c.id);
                    const hasSavedStories = clustersWithCorpus.has(c.id);
                    return (
                      <div
                        key={c.id}
                        className={`flex gap-2 rounded-lg border p-2 transition-colors ${
                          active ? 'border-primary bg-primary/5' : 'border-border'
                        } ${inBatch ? 'ring-1 ring-primary/30' : ''}`}
                      >
                        <label className="flex shrink-0 cursor-pointer items-center justify-center px-1 min-h-[44px] min-w-[44px]">
                          <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-input"
                            checked={inBatch}
                            onChange={() => toggleBatchCluster(c.id)}
                            aria-label={`Include ${c.label} in batch generation`}
                          />
                        </label>
                        <div className="flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => setSelectedClusterId(c.id)}
                            className="min-h-[44px] w-full text-left rounded-md px-1 py-1 hover:bg-muted/50"
                          >
                            <p className="font-medium text-sm">{c.label}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{c.valueLine}</p>
                          </button>
                          {hasSavedStories ? (
                            <Link
                              href={`/dashboard/projects/${projectId}/user-stories/${c.id}`}
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline px-1 pb-1 min-h-[44px]"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {t('userStories.openSavedStories')}
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {confirmed && generationTargetCount > 0 && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                <p className="text-sm font-medium">
                  {t('userStories.generateUserStories')}
                  {generationTargetCount > 1 ? ` (${generationTargetCount} clusters)` : ''}
                </p>
                {!selectedClusterId && batchClusterIds.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t('userStories.batchGenerateHelp')}
                  </p>
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={generatingTemplate || generatingAi}
                    onClick={() => handleGenerate('template')}
                    className="min-h-[44px] w-full sm:w-auto"
                  >
                    {generatingTemplate ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span className="ml-2">{t('userStories.fromClusterTemplate')}</span>
                  </Button>
                  <Button
                    type="button"
                    disabled={generatingAi || generatingTemplate}
                    onClick={() => handleGenerate('ai')}
                    className="min-h-[44px] w-full sm:w-auto"
                  >
                    {generatingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    <span className="ml-2">{t('userStories.draftWithAi')}</span>
                  </Button>
                  {generatingAi ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelGeneration}
                      className="min-h-[44px] w-full sm:w-auto"
                    >
                      <X className="h-4 w-4" />
                      <span className="ml-2">{t('userStories.cancelGeneration')}</span>
                    </Button>
                  ) : null}
                </div>
                {batchClusterIds.length > 0 && (
                  <div className="border-t border-primary/10 pt-3">
                    <p className="text-xs text-muted-foreground mb-2">
                      {t('userStories.readyToSplitHelp')}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      asChild
                      className="min-h-[44px] w-full sm:w-auto"
                    >
                      <Link
                        href={`/dashboard/projects/${projectId}/task-split?storyTitles=${encodeURIComponent(
                          JSON.stringify(
                            batchClusterIds
                              .map((id) => {
                                const c = clusters.find((cl) => cl.id === id);
                                return c ? c.label : null;
                              })
                              .filter(Boolean)
                          )
                        )}`}
                      >
                        <Zap className="h-4 w-4" />
                        <span className="ml-2">
                          {t('userStories.splitAllIntoTasks')} ({batchClusterIds.length})
                        </span>
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {selectedClusterId && (
              <>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving || loadingCorpus}
                    onClick={handleSave}
                    className="min-h-[44px] w-full sm:w-auto"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    <span className={saving ? 'ml-2' : ''}>{t('common.save')}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={markingReady || !hasPersistedCorpus || loadingCorpus}
                    onClick={handleMarkReviewReady}
                    className="min-h-[44px] w-full sm:w-auto"
                  >
                    {markingReady ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    <span className="ml-2">{t('userStories.markReviewReady')}</span>
                  </Button>
                  <Button type="button" variant="ghost" asChild className="min-h-[44px] w-full sm:w-auto">
                    <Link href={`/dashboard/projects/${projectId}/user-stories/${selectedClusterId}`}>
                      <ExternalLink className="h-4 w-4" />
                      <span className="ml-2">{t('userStories.openFullPage')}</span>
                    </Link>
                  </Button>
                </div>

                {reviewReadyAt && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    {t('userStories.reviewReadySince')} {new Date(reviewReadyAt).toLocaleString()}
                  </p>
                )}

                {loadingCorpus ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lines.map((line, index) => (
                      <div key={line.id ?? `new-${index}`} className="rounded-lg border p-3 sm:p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-medium text-muted-foreground">{t('userStories.story')} {index + 1}</span>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="min-h-[44px] min-w-[44px]"
                              disabled={index === 0}
                              onClick={() => handleMoveLine(index, 'up')}
                              aria-label={t('userStories.moveStoryUp')}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="min-h-[44px] min-w-[44px]"
                              disabled={index === lines.length - 1}
                              onClick={() => handleMoveLine(index, 'down')}
                              aria-label={t('userStories.moveStoryDown')}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
                              onClick={() => handleArchiveLine(index)}
                              aria-label={t('userStories.archiveStory')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <input
                          className="w-full min-h-[44px] rounded-md border bg-background px-3 py-2 text-base font-medium"
                          placeholder={t('common.title')}
                          value={line.title}
                          onChange={(e) => handleLineChange(index, 'title', e.target.value)}
                        />
                        <textarea
                          className="w-full min-h-[120px] rounded-md border bg-background px-3 py-2 text-base"
                          placeholder={t('userStories.storyTemplatePlaceholder')}
                          value={line.body}
                          onChange={(e) => handleLineChange(index, 'body', e.target.value)}
                        />
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={handleAddLine} className="min-h-[44px] w-full sm:w-auto">
                      <Plus className="h-4 w-4" />
                      <span className="ml-2">{t('userStories.addStory')}</span>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
