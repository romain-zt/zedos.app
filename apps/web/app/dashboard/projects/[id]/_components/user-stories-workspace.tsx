'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/animate';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import {
  FeatureSplitListResponseSchema,
  type FeatureCluster,
  type FeatureSplitDTO,
} from '@repo/contracts/feature-split/feature-split';
import { PrdVersionListResponseSchema, type PrdVersionDTO } from '@repo/contracts/prd/prd-contracts';
import { GenerateUserStoriesResponseSchema } from '@repo/contracts/user-stories';
import { UserStoryCorpusSchema, type UserStoryCorpusDTO } from '@repo/contracts/user-stories';

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

function corpusToDrafts(corpus: UserStoryCorpusDTO): LineDraft[] {
  const active = corpus.lines.filter((l) => !l.archivedAt);
  const sorted = [...active].sort((a, b) => a.sortOrder - b.sortOrder);
  return sorted.map((l) => ({
    id: l.id,
    sortOrder: l.sortOrder,
    title: l.title,
    body: l.body,
    draftMarker: l.draftMarker,
  }));
}

export function UserStoriesWorkspace({ projectId, projectName }: UserStoriesWorkspaceProps) {
  const [prdVersions, setPrdVersions] = useState<PrdVersionDTO[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [splits, setSplits] = useState<FeatureSplitDTO[]>([]);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [reviewReadyAt, setReviewReadyAt] = useState<Date | null>(null);
  const [hasPersistedCorpus, setHasPersistedCorpus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingCorpus, setLoadingCorpus] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingTemplate, setGeneratingTemplate] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [markingReady, setMarkingReady] = useState(false);

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

  const fetchCorpus = useCallback(
    async (clusterId: string) => {
      setLoadingCorpus(true);
      try {
        const res = await fetch(
          `/api/projects/${projectId}/user-stories?featureSplitClusterId=${encodeURIComponent(clusterId)}`
        );
        if (res.status === 404) {
          setLines([emptyLine(0)]);
          setReviewReadyAt(null);
          setHasPersistedCorpus(false);
          return;
        }
        if (!res.ok) {
          toast.error('Could not load user stories');
          return;
        }
        const raw = await res.json();
        const parsed = UserStoryCorpusSchema.safeParse(raw);
        if (!parsed.success) {
          toast.error('Unexpected corpus response');
          return;
        }
        const corpus = parsed.data;
        setReviewReadyAt(corpus.reviewReadyAt);
        setHasPersistedCorpus(true);
        setLines(corpusToDrafts(corpus).length > 0 ? corpusToDrafts(corpus) : [emptyLine(0)]);
      } catch {
        toast.error('Network error loading stories');
      } finally {
        setLoadingCorpus(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  useEffect(() => {
    if (selectedVersionId) {
      setSelectedClusterId(null);
      setLines([]);
      fetchSplitsForVersion(selectedVersionId);
    }
  }, [selectedVersionId, fetchSplitsForVersion]);

  useEffect(() => {
    if (selectedClusterId) {
      fetchCorpus(selectedClusterId);
    }
  }, [selectedClusterId, fetchCorpus]);

  const confirmed = selectedVersionId ? confirmedSplitForVersion(splits, selectedVersionId) : null;
  const clusters: FeatureCluster[] = confirmed?.clusters ?? [];

  const handleLineChange = (index: number, field: keyof LineDraft, value: string | number) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
  };

  const handleAddLine = () => {
    setLines((prev) => [...prev, emptyLine(prev.length)]);
  };

  const handleRemoveLine = (index: number) => {
    setLines((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((line, i) => ({ ...line, sortOrder: i }))
    );
  };

  const buildSavePayload = (clusterId: string) => {
    const valid = lines.filter((l) => l.title.trim() && l.body.trim());
    return {
      featureSplitClusterId: clusterId,
      lines: valid.map((l) => ({
        ...(l.id ? { id: l.id } : {}),
        sortOrder: l.sortOrder,
        title: l.title.trim(),
        body: l.body.trim(),
        archivedAt: l.archivedAt ?? null,
        draftMarker: l.draftMarker ?? null,
      })),
    };
  };

  const applyCorpusResponse = (raw: unknown) => {
    const parsed = UserStoryCorpusSchema.safeParse(raw);
    if (!parsed.success) {
      toast.error('Unexpected response');
      return;
    }
    const corpus = parsed.data;
    setReviewReadyAt(corpus.reviewReadyAt);
    setHasPersistedCorpus(true);
    setLines(corpusToDrafts(corpus));
  };

  const handleSave = async () => {
    if (!selectedClusterId) return;
    const payload = buildSavePayload(selectedClusterId);
    if (payload.lines.length === 0) {
      toast.error('Add at least one story with title and description');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/user-stories`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const raw = await res.json();
      if (!res.ok) {
        toast.error(raw?.error ?? 'Save failed');
        return;
      }
      applyCorpusResponse(raw);
      toast.success('Stories saved');
    } catch {
      toast.error('Network error while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async (mode: 'template' | 'ai') => {
    if (!selectedClusterId) return;
    const setBusy = mode === 'template' ? setGeneratingTemplate : setGeneratingAi;
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/user-stories/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureSplitClusterId: selectedClusterId, mode }),
      });
      const raw = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          toast.error('Insufficient credits for AI generation');
        } else {
          toast.error(raw?.error ?? 'Generation failed');
        }
        return;
      }
      const parsed = GenerateUserStoriesResponseSchema.safeParse(raw);
      if (!parsed.success) {
        toast.error('Unexpected generate response');
        return;
      }
      applyCorpusResponse(parsed.data.corpus);
      toast.success(mode === 'template' ? 'Template story loaded' : 'AI drafts loaded — review and save');
    } catch {
      toast.error('Network error during generation');
    } finally {
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
        toast.error(raw?.error ?? 'Could not mark review-ready');
        return;
      }
      applyCorpusResponse(raw);
      toast.success('Marked ready for review');
    } catch {
      toast.error('Network error');
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
                Back to workspace
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                <BookOpen className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 text-primary" />
                User stories
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">{projectName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild className="min-h-[44px]">
                <Link href={`/dashboard/projects/${projectId}/feature-split`}>Feature split</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4 sm:p-6 space-y-6">
            <div className="space-y-2">
              <label htmlFor="prd-version" className="text-sm font-medium">
                PRD version
              </label>
              <select
                id="prd-version"
                className="w-full min-h-[44px] rounded-md border bg-background px-3 py-2 text-base"
                value={selectedVersionId ?? ''}
                onChange={(e) => setSelectedVersionId(e.target.value || null)}
              >
                <option value="" disabled>
                  Select version
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
                <p className="font-medium text-foreground">Confirm your feature split first</p>
                <p className="text-muted-foreground mt-1">
                  User stories are anchored to clusters from a confirmed split. Finish and confirm the split for this
                  PRD version, then return here.
                </p>
                <Button asChild className="mt-3 min-h-[44px]">
                  <Link href={`/dashboard/projects/${projectId}/feature-split`}>Open feature split</Link>
                </Button>
              </div>
            )}

            {confirmed && clusters.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Cluster</span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {clusters.map((c) => {
                    const active = selectedClusterId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedClusterId(c.id)}
                        className={`rounded-lg border p-3 text-left transition-colors min-h-[44px] ${
                          active ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <p className="font-medium text-sm">{c.label}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{c.valueLine}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedClusterId && (
              <>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center border-t pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={generatingTemplate || loadingCorpus}
                    onClick={() => handleGenerate('template')}
                    className="min-h-[44px] w-full sm:w-auto"
                  >
                    {generatingTemplate ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span className="ml-2">From cluster (template)</span>
                  </Button>
                  <Button
                    type="button"
                    disabled={generatingAi || loadingCorpus}
                    onClick={() => handleGenerate('ai')}
                    className="min-h-[44px] w-full sm:w-auto"
                  >
                    {generatingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    <span className="ml-2">Draft with AI</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving || loadingCorpus}
                    onClick={handleSave}
                    className="min-h-[44px] w-full sm:w-auto"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    <span className={saving ? 'ml-2' : ''}>Save</span>
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
                    <span className="ml-2">Mark review-ready</span>
                  </Button>
                </div>

                {reviewReadyAt && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    Review-ready since {new Date(reviewReadyAt).toLocaleString()}
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
                          <span className="text-xs font-medium text-muted-foreground">Story {index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
                            onClick={() => handleRemoveLine(index)}
                            aria-label="Remove story"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <input
                          className="w-full min-h-[44px] rounded-md border bg-background px-3 py-2 text-base font-medium"
                          placeholder="Title"
                          value={line.title}
                          onChange={(e) => handleLineChange(index, 'title', e.target.value)}
                        />
                        <textarea
                          className="w-full min-h-[120px] rounded-md border bg-background px-3 py-2 text-base"
                          placeholder="As a … I want … so that …"
                          value={line.body}
                          onChange={(e) => handleLineChange(index, 'body', e.target.value)}
                        />
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={handleAddLine} className="min-h-[44px] w-full sm:w-auto">
                      <Plus className="h-4 w-4" />
                      <span className="ml-2">Add story</span>
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
