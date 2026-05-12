'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FadeIn } from '@/components/ui/animate';
import {
  ArrowLeft,
  BookOpenCheck,
  Wand2,
  FileStack,
  CheckCircle,
  Layers,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  FeatureSplitListResponseSchema,
  type FeatureSplitConfirmed,
} from '@repo/contracts/feature-split/feature-split';
import {
  PrdVersionListResponseSchema,
  type PrdVersionDTO,
} from '@repo/contracts/prd/prd-contracts';
import {
  GetUserStoryCorpusResponseSchema,
  SaveUserStoryCorpusRequestSchema,
  MarkUserStoriesReviewReadyRequestSchema,
  type UserStoryLineSaveInput,
  type SaveUserStoryCorpusRequest,
  type UserStoryLineDTO,
} from '@repo/contracts/user-stories/corpus';
import {
  GenerateUserStoriesRequestSchema,
  GenerateUserStoriesResponseSchema,
} from '@repo/contracts/user-stories/generate';

interface UserStoriesWorkspaceProps {
  projectId: string;
  projectName: string;
}

interface LineDraft {
  id?: string;
  sortOrder: number;
  title: string;
  body: string;
  archivedAt?: Date | null;
  draftMarker?: string | null;
}

/** Normalizes corpus line rows validated by corpus/generate schemas (strict output typing drifts vs `UserStoryLineDTO` in TS). */
function linesToDrafts(lines: readonly UserStoryLineDTO[]): LineDraft[] {
  return lines
    .filter((l) => !l.archivedAt)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((l) => ({
      id: l.id,
      sortOrder: l.sortOrder,
      title: l.title,
      body: l.body,
      archivedAt: l.archivedAt,
      draftMarker: l.draftMarker,
    }));
}

function emptyLine(sortOrder: number): LineDraft {
  return {
    sortOrder,
    title: '',
    body: '',
    archivedAt: null,
    draftMarker: null,
  };
}

export function UserStoriesWorkspace({ projectId, projectName }: UserStoriesWorkspaceProps) {
  const [prdVersions, setPrdVersions] = useState<PrdVersionDTO[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [clusters, setClusters] = useState<{ id: string; label: string }[]>([]);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [lines, setLines] = useState<LineDraft[]>([emptyLine(0)]);
  const [reviewReadyAt, setReviewReadyAt] = useState<Date | null>(null);
  const [corpusExists, setCorpusExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingCorpus, setLoadingCorpus] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [generatingTemplate, setGeneratingTemplate] = useState(false);
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
      /* ignore */
    }
  }, [projectId, selectedVersionId]);

  const loadSplitsForVersion = useCallback(
    async (prdVersionId: string) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/projects/${projectId}/feature-split?sourcePrdVersionId=${encodeURIComponent(prdVersionId)}`
        );
        if (!res.ok) {
          setClusters([]);
          setSelectedClusterId(null);
          return;
        }
        const raw = await res.json();
        const parsed = FeatureSplitListResponseSchema.safeParse(raw);
        if (!parsed.success) {
          setClusters([]);
          setSelectedClusterId(null);
          return;
        }
        const confirmedSplits = parsed.data.filter(
          (s): s is FeatureSplitConfirmed => s.status === 'confirmed'
        );
        const opts = confirmedSplits.flatMap((split) =>
          split.clusters.map((c) => ({ id: c.id, label: c.label }))
        );
        setClusters(opts);
        setSelectedClusterId((prev) =>
          prev && opts.some((o) => o.id === prev) ? prev : opts[0]?.id ?? null
        );
      } catch {
        setClusters([]);
      } finally {
        setLoading(false);
      }
    },
    [projectId]
  );

  const fetchCorpus = useCallback(
    async (featureSplitClusterId: string) => {
      setLoadingCorpus(true);
      try {
        const res = await fetch(
          `/api/projects/${projectId}/user-stories?featureSplitClusterId=${encodeURIComponent(featureSplitClusterId)}`
        );
        const raw = await res.json();
        if (!res.ok) {
          setCorpusExists(false);
          setReviewReadyAt(null);
          setLines([emptyLine(0)]);
          return;
        }
        const parsed = GetUserStoryCorpusResponseSchema.safeParse(raw);
        if (!parsed.success || !parsed.data.corpus) {
          setCorpusExists(false);
          setReviewReadyAt(null);
          setLines([emptyLine(0)]);
          return;
        }
        const c = parsed.data.corpus;
        setCorpusExists(true);
        setReviewReadyAt(c.reviewReadyAt);
        const active = linesToDrafts(c.lines);
        setLines(active.length > 0 ? active : [emptyLine(0)]);
      } catch {
        setLines([emptyLine(0)]);
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
    if (selectedVersionId) loadSplitsForVersion(selectedVersionId);
  }, [selectedVersionId, loadSplitsForVersion]);

  useEffect(() => {
    if (selectedClusterId) fetchCorpus(selectedClusterId);
    else {
      setCorpusExists(false);
      setLines([emptyLine(0)]);
      setReviewReadyAt(null);
    }
  }, [selectedClusterId, fetchCorpus]);

  const isReviewLocked = !!reviewReadyAt;

  const buildSavePayload = (): SaveUserStoryCorpusRequest | null => {
    if (!selectedClusterId) return null;
    const valid = lines.filter((l) => l.title.trim() && l.body.trim());
    if (valid.length === 0) return null;
    const payloadLines: UserStoryLineSaveInput[] = valid.map((l, idx) => {
      const base: UserStoryLineSaveInput = {
        ...(l.id ? { id: l.id } : {}),
        sortOrder: idx,
        title: l.title.trim(),
        body: l.body.trim(),
        archivedAt: l.archivedAt ?? null,
        draftMarker: l.draftMarker ?? null,
      };
      return base;
    });
    return { featureSplitClusterId: selectedClusterId, lines: payloadLines };
  };

  const handleSave = async () => {
    if (isReviewLocked) return;
    const payload = buildSavePayload();
    if (!payload) {
      toast.error('Add at least one story with title and body');
      return;
    }
    const check = SaveUserStoryCorpusRequestSchema.safeParse(payload);
    if (!check.success) {
      toast.error('Invalid story payload');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/user-stories`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(check.data),
      });
      const raw = await res.json();
      if (!res.ok) {
        toast.error(raw?.error ?? 'Save failed');
        return;
      }
      const dto = GenerateUserStoriesResponseSchema.safeParse(raw);
      if (!dto.success) {
        toast.error('Unexpected response');
        return;
      }
      setCorpusExists(true);
      const nextLines = dto.data.corpus.lines;
      const active = linesToDrafts(nextLines);
      setLines(active.length > 0 ? active : [emptyLine(0)]);
      setReviewReadyAt(dto.data.corpus.reviewReadyAt);
      toast.success('Stories saved');
    } catch {
      toast.error('Network error while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async (mode: 'ai' | 'template') => {
    if (!selectedClusterId || isReviewLocked) return;
    const setter = mode === 'ai' ? setGeneratingAi : setGeneratingTemplate;
    setter(true);
    try {
      const bodyRaw = { featureSplitClusterId: selectedClusterId, mode };
      const parsedReq = GenerateUserStoriesRequestSchema.safeParse(bodyRaw);
      if (!parsedReq.success) {
        toast.error('Invalid generate request');
        return;
      }
      const res = await fetch(`/api/projects/${projectId}/user-stories/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedReq.data),
      });
      const raw = await res.json();
      if (!res.ok) {
        if (res.status === 402) toast.error('Insufficient credits for AI generation');
        else toast.error(raw?.error ?? 'Generation failed');
        return;
      }
      const dto = GenerateUserStoriesResponseSchema.safeParse(raw);
      if (!dto.success) {
        toast.error('Unexpected generation response');
        return;
      }
      setCorpusExists(true);
      const active = linesToDrafts(dto.data.corpus.lines);
      setLines(active.length > 0 ? active : [emptyLine(0)]);
      setReviewReadyAt(dto.data.corpus.reviewReadyAt);
      toast.success(mode === 'ai' ? 'AI draft merged into workspace' : 'Template stories loaded');
    } catch {
      toast.error('Network error');
    } finally {
      setter(false);
    }
  };

  const handleReviewReady = async () => {
    if (!selectedClusterId || !corpusExists || isReviewLocked) return;
    setMarkingReady(true);
    try {
      const body = { featureSplitClusterId: selectedClusterId };
      const parsedBody = MarkUserStoriesReviewReadyRequestSchema.safeParse(body);
      if (!parsedBody.success) {
        toast.error('Invalid request');
        return;
      }
      const res = await fetch(`/api/projects/${projectId}/user-stories/review-ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedBody.data),
      });
      const raw = await res.json();
      if (!res.ok) {
        toast.error(raw?.error ?? 'Could not mark review-ready');
        return;
      }
      const dto = GenerateUserStoriesResponseSchema.safeParse(raw);
      if (!dto.success) {
        toast.error('Unexpected response');
        return;
      }
      setReviewReadyAt(dto.data.corpus.reviewReadyAt);
      toast.success('Marked review-ready');
    } catch {
      toast.error('Network error');
    } finally {
      setMarkingReady(false);
    }
  };

  const handleLineChange = (index: number, field: keyof LineDraft, value: string | number) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const handleAddLine = () => {
    setLines((prev) => [...prev, emptyLine(prev.length)]);
  };

  const handleRemoveLine = (index: number) => {
    setLines((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index).map((l, i) => ({ ...l, sortOrder: i }))
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6">
        <div className="mb-6">
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 min-h-11 py-2"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back to {projectName}
          </Link>
          <Link
            href={`/dashboard/projects/${projectId}/feature-split`}
            className="block text-xs text-muted-foreground hover:text-foreground mb-2"
          >
            ← Feature split
          </Link>
          <div className="flex items-center gap-3">
            <BookOpenCheck className="h-6 w-6 text-primary shrink-0" aria-hidden />
            <div className="min-w-0">
              <h1 className="text-xl font-semibold">User stories</h1>
              <p className="text-sm text-muted-foreground">
                Draft and refine stories per confirmed feature cluster (uses credits for AI drafts).
              </p>
            </div>
          </div>
        </div>

        {prdVersions.length > 1 && (
          <div className="mb-4">
            <label className="text-sm font-medium mb-1 block">PRD version</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm min-h-11"
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

        {loading && (
          <div className="py-12 text-center text-muted-foreground text-sm">Loading splits…</div>
        )}

        {!loading && clusters.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-4 text-sm space-y-2">
            <p className="font-medium flex items-center gap-2">
              <Layers className="h-4 w-4" />
              No confirmed clusters
            </p>
            <p className="text-muted-foreground">
              Confirm a feature split first, then pick a cluster to attach user stories.
            </p>
            <Button variant="outline" size="sm" className="min-h-11 mt-2" asChild>
              <Link href={`/dashboard/projects/${projectId}/feature-split`}>Go to feature split</Link>
            </Button>
          </div>
        )}

        {!loading && clusters.length > 0 && (
          <>
            <div className="mb-4">
              <label className="text-sm font-medium mb-1 block">Feature cluster</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm min-h-11"
                value={selectedClusterId ?? ''}
                onChange={(e) => setSelectedClusterId(e.target.value || null)}
              >
                {clusters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {reviewReadyAt && (
              <div className="mb-4 inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 font-medium">
                <CheckCircle className="h-3 w-3" />
                Review-ready
              </div>
            )}

            {!isReviewLocked && (
              <div className="flex flex-wrap gap-2 mb-6">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  onClick={() => handleGenerate('ai')}
                  disabled={generatingAi || generatingTemplate || loadingCorpus || !selectedClusterId}
                >
                  <Wand2 className="h-4 w-4 mr-1" aria-hidden />
                  {generatingAi ? 'Generating…' : 'AI draft'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  onClick={() => handleGenerate('template')}
                  disabled={generatingAi || generatingTemplate || loadingCorpus || !selectedClusterId}
                >
                  <FileStack className="h-4 w-4 mr-1" aria-hidden />
                  {generatingTemplate ? 'Loading…' : 'Template'}
                </Button>
                <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={handleAddLine}>
                  <Plus className="h-4 w-4 mr-1" aria-hidden />
                  Add story
                </Button>
              </div>
            )}

            {loadingCorpus && (
              <div className="py-8 text-center text-muted-foreground text-sm">Loading corpus…</div>
            )}

            {!loadingCorpus && (
              <FadeIn>
                <div className="space-y-4">
                  {lines.map((line, index) => (
                    <div
                      key={`${line.id ?? 'new'}-${index}`}
                      className="border border-border rounded-lg p-4 space-y-3 bg-card"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Story {index + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          {line.draftMarker && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              Draft
                            </span>
                          )}
                          {!isReviewLocked && lines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(index)}
                              className="text-muted-foreground hover:text-destructive p-2 min-h-11 min-w-11 inline-flex items-center justify-center rounded-md"
                              aria-label="Remove story"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium mb-1 block">Title</label>
                        <input
                          type="text"
                          className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm min-h-11 disabled:opacity-60"
                          value={line.title}
                          onChange={(e) => handleLineChange(index, 'title', e.target.value)}
                          disabled={isReviewLocked}
                          maxLength={2000}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium mb-1 block">Body</label>
                        <textarea
                          className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm min-h-[120px] sm:min-h-[140px] disabled:opacity-60"
                          value={line.body}
                          onChange={(e) => handleLineChange(index, 'body', e.target.value)}
                          disabled={isReviewLocked}
                          maxLength={50_000}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {!isReviewLocked && (
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 sm:flex-none min-h-11"
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      onClick={handleReviewReady}
                      disabled={markingReady || !corpusExists}
                      className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 min-h-11"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" aria-hidden />
                      {markingReady ? 'Updating…' : 'Mark review-ready'}
                    </Button>
                  </div>
                )}
              </FadeIn>
            )}
          </>
        )}
      </div>
    </div>
  );
}
