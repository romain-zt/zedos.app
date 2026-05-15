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
  Trash2,
} from 'lucide-react';
import {
  FeatureSplitListResponseSchema,
  type FeatureCluster,
} from '@repo/contracts/feature-split/feature-split';
import { UserStoryCorpusSchema, type UserStoryCorpusDTO } from '@repo/contracts/user-stories';

interface ClusterStoriesDetailProps {
  projectId: string;
  projectName: string;
  clusterId: string;
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

export function ClusterStoriesDetail({
  projectId,
  projectName,
  clusterId,
}: ClusterStoriesDetailProps) {
  const [cluster, setCluster] = useState<FeatureCluster | null>(null);
  const [lines, setLines] = useState<LineDraft[]>([emptyLine(0)]);
  const [reviewReadyAt, setReviewReadyAt] = useState<Date | null>(null);
  const [hasPersistedCorpus, setHasPersistedCorpus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [markingReady, setMarkingReady] = useState(false);

  const fetchCluster = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/feature-split`);
      if (!res.ok) return;
      const raw = await res.json();
      const parsed = FeatureSplitListResponseSchema.safeParse(raw);
      if (!parsed.success) return;
      for (const split of parsed.data) {
        const found = split.clusters?.find((c) => c.id === clusterId);
        if (found) {
          setCluster(found);
          return;
        }
      }
    } catch {
      // network
    }
  }, [projectId, clusterId]);

  const fetchCorpus = useCallback(async () => {
    setLoading(true);
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
        toast.error('Could not load stories');
        return;
      }
      const raw = await res.json();
      const parsed = UserStoryCorpusSchema.safeParse(raw);
      if (!parsed.success) {
        toast.error('Unexpected response');
        return;
      }
      const corpus = parsed.data;
      setReviewReadyAt(corpus.reviewReadyAt);
      setHasPersistedCorpus(true);
      const drafts = corpusToDrafts(corpus);
      setLines(drafts.length > 0 ? drafts : [emptyLine(0)]);
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }, [projectId, clusterId]);

  useEffect(() => {
    fetchCluster();
    fetchCorpus();
  }, [fetchCluster, fetchCorpus]);

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

  const handleSave = async () => {
    const valid = lines.filter((l) => l.title.trim() && l.body.trim());
    if (valid.length === 0) {
      toast.error('Add at least one story with title and description');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/user-stories`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureSplitClusterId: clusterId,
          lines: valid.map((l) => ({
            ...(l.id ? { id: l.id } : {}),
            sortOrder: l.sortOrder,
            title: l.title.trim(),
            body: l.body.trim(),
            archivedAt: l.archivedAt ?? null,
            draftMarker: l.draftMarker ?? null,
          })),
        }),
      });
      const raw = await res.json();
      if (!res.ok) {
        toast.error(raw?.error ?? 'Save failed');
        return;
      }
      const parsed = UserStoryCorpusSchema.safeParse(raw);
      if (parsed.success) {
        setReviewReadyAt(parsed.data.reviewReadyAt);
        setHasPersistedCorpus(true);
        const drafts = corpusToDrafts(parsed.data);
        setLines(drafts.length > 0 ? drafts : [emptyLine(0)]);
      }
      toast.success('Stories saved');
    } catch {
      toast.error('Network error while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkReviewReady = async () => {
    if (!hasPersistedCorpus) return;
    setMarkingReady(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/user-stories/review-ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureSplitClusterId: clusterId }),
      });
      const raw = await res.json();
      if (!res.ok) {
        toast.error(raw?.error ?? 'Could not mark review-ready');
        return;
      }
      const parsed = UserStoryCorpusSchema.safeParse(raw);
      if (parsed.success) {
        setReviewReadyAt(parsed.data.reviewReadyAt);
        const drafts = corpusToDrafts(parsed.data);
        setLines(drafts.length > 0 ? drafts : [emptyLine(0)]);
      }
      toast.success('Marked ready for review');
    } catch {
      toast.error('Network error');
    } finally {
      setMarkingReady(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="mb-6">
            <Link
              href={`/dashboard/projects/${projectId}/user-stories`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3 min-h-[44px]"
            >
              <ArrowLeft className="h-4 w-4" />
              All clusters
            </Link>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
                  <BookOpen className="h-6 w-6 shrink-0 text-primary" />
                  {cluster?.label ?? 'User stories'}
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">{projectName}</p>
              </div>
              {reviewReadyAt && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 shrink-0">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  Review-ready
                </p>
              )}
            </div>
            {cluster?.valueLine && (
              <p className="mt-2 text-sm text-muted-foreground">{cluster.valueLine}</p>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {lines.map((line, index) => (
                <div
                  key={line.id ?? `new-${index}`}
                  className="rounded-lg border bg-card p-4 sm:p-5 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Story {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-9 w-9 text-destructive hover:text-destructive"
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
                    className="w-full min-h-[140px] rounded-md border bg-background px-3 py-2 text-sm leading-relaxed resize-none"
                    placeholder="Given … When … Then …"
                    value={line.body}
                    onChange={(e) => handleLineChange(index, 'body', e.target.value)}
                  />
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={handleAddLine}
                className="min-h-[44px] w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add story
              </Button>

              <div className="flex flex-col gap-2 sm:flex-row pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={handleSave}
                  className="min-h-[44px] sm:flex-1"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={markingReady || !hasPersistedCorpus}
                  onClick={handleMarkReviewReady}
                  className="min-h-[44px] sm:flex-1"
                >
                  {markingReady ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Mark review-ready
                </Button>
              </div>
            </div>
          )}
        </FadeIn>
      </div>
    </div>
  );
}
