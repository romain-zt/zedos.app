'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { FadeIn } from '@/components/ui/animate';
import { toast } from 'sonner';
import {
  FeatureSplitListResponseSchema,
  type FeatureSplitDTO,
} from '@repo/contracts/feature-split/feature-split';
import { PrdVersionListResponseSchema } from '@repo/contracts/prd/prd-contracts';
import {
  GenerateTaskSplitDraftResponseSchema,
  TaskSplitBundleSchema,
  type TaskSplitBundleDTO,
} from '@repo/contracts/task-split';
import { UserStoryCorpusSchema } from '@repo/contracts/user-stories';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  ChevronDown,
  Loader2,
  Lock,
  Package,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import { useI18n } from '@/src/i18n';

interface TaskSplitWorkspaceProps {
  projectId: string;
  projectName: string;
}

type EligibleStory = {
  lineId: string;
  title: string;
  excerpt: string;
  clusterLabel: string;
};

type TaskDraft = {
  id?: string;
  sortOrder: number;
  title: string;
  promptBody: string;
  manual: boolean;
};

function emptyTask(sortOrder: number): TaskDraft {
  return { sortOrder, title: '', promptBody: '', manual: true };
}

function bundleToDrafts(bundle: TaskSplitBundleDTO): TaskDraft[] {
  return [...bundle.tasks]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((t) => ({
      id: t.id,
      sortOrder: t.sortOrder,
      title: t.title,
      promptBody: t.promptBody,
      manual: t.manual,
    }));
}

export function TaskSplitWorkspace({ projectId, projectName }: TaskSplitWorkspaceProps) {
  const { t } = useI18n();
  const [eligibleStories, setEligibleStories] = useState<EligibleStory[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [bundle, setBundle] = useState<TaskSplitBundleDTO | null>(null);
  const [tasks, setTasks] = useState<TaskDraft[]>([]);
  const [loadingBundle, setLoadingBundle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingTemplate, setGeneratingTemplate] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [locking, setLocking] = useState(false);

  const isLocked = bundle?.lockedAt != null;

  const loadEligibleStories = useCallback(async () => {
    setLoadingStories(true);
    try {
      const prdRes = await fetch(`/api/projects/${projectId}/prd`);
      if (!prdRes.ok) {
        setEligibleStories([]);
        return;
      }
      const prdRaw: unknown = await prdRes.json();
      const prdParsed = PrdVersionListResponseSchema.safeParse(prdRaw);
      if (!prdParsed.success) {
        setEligibleStories([]);
        return;
      }

      const found: EligibleStory[] = [];

      for (const version of prdParsed.data) {
        const splitRes = await fetch(
          `/api/projects/${projectId}/feature-split?sourcePrdVersionId=${encodeURIComponent(version.id)}`
        );
        if (!splitRes.ok) continue;
        const splitRaw: unknown = await splitRes.json();
        const splitParsed = FeatureSplitListResponseSchema.safeParse(splitRaw);
        if (!splitParsed.success) continue;

        const confirmed = splitParsed.data.find((s: FeatureSplitDTO) => s.status === 'confirmed');
        if (!confirmed) continue;

        for (const cluster of confirmed.clusters) {
          const corpusRes = await fetch(
            `/api/projects/${projectId}/user-stories?featureSplitClusterId=${encodeURIComponent(cluster.id)}`
          );
          if (corpusRes.status === 404) continue;
          if (!corpusRes.ok) continue;
          const corpusRaw: unknown = await corpusRes.json();
          const corpusParsed = UserStoryCorpusSchema.safeParse(corpusRaw);
          if (!corpusParsed.success || !corpusParsed.data.reviewReadyAt) continue;

          for (const line of corpusParsed.data.lines) {
            if (line.archivedAt) continue;
            found.push({
              lineId: line.id,
              title: line.title,
              excerpt: line.body.length > 160 ? `${line.body.slice(0, 160)}…` : line.body,
              clusterLabel: cluster.label,
            });
          }
        }
      }

      setEligibleStories(found);
      if (found.length > 0) {
        setSelectedLineId((prev) => prev ?? found[0].lineId);
      }
    } catch {
      setEligibleStories([]);
    } finally {
      setLoadingStories(false);
    }
  }, [projectId]);

  const loadBundle = useCallback(
    async (lineId: string) => {
      setLoadingBundle(true);
      try {
        const res = await fetch(
          `/api/projects/${projectId}/task-split?userStoryLineId=${encodeURIComponent(lineId)}`
        );
        if (res.status === 404) {
          setBundle(null);
          setTasks([emptyTask(0)]);
          return;
        }
        if (!res.ok) {
          toast.error(t('taskSplit.loadBundleFailed'));
          return;
        }
        const raw: unknown = await res.json();
        const parsed = TaskSplitBundleSchema.safeParse(raw);
        if (!parsed.success) {
          toast.error(t('common.unexpectedResponse'));
          return;
        }
        setBundle(parsed.data);
        setTasks(bundleToDrafts(parsed.data));
      } catch {
        toast.error(t('taskSplit.networkErrorLoadingBundle'));
      } finally {
        setLoadingBundle(false);
      }
    },
    [projectId, t]
  );

  useEffect(() => {
    void loadEligibleStories();
  }, [loadEligibleStories]);

  useEffect(() => {
    if (selectedLineId) {
      void loadBundle(selectedLineId);
    }
  }, [selectedLineId, loadBundle]);

  const normalizeSortOrders = (list: TaskDraft[]): TaskDraft[] =>
    list.map((t, i) => ({ ...t, sortOrder: i }));

  const handleSave = async () => {
    if (!selectedLineId || isLocked) return;
    const valid = tasks.filter((t) => t.title.trim() && t.promptBody.trim());
    if (valid.length < 1) {
      toast.error(t('taskSplit.addOneTaskRequired'));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/task-split`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userStoryLineId: selectedLineId,
          tasks: normalizeSortOrders(valid).map((t) => ({
            id: t.id,
            sortOrder: t.sortOrder,
            title: t.title.trim(),
            promptBody: t.promptBody.trim(),
            manual: t.manual,
          })),
        }),
      });
      if (res.status === 402) {
        toast.error(t('taskSplit.insufficientCredits'));
        return;
      }
      if (!res.ok) {
        const body: { error?: string } = await res.json().catch(() => ({}));
        toast.error(body.error ?? t('common.saveFailed'));
        return;
      }
      const raw: unknown = await res.json();
      const parsed = TaskSplitBundleSchema.safeParse(raw);
      if (!parsed.success) {
        toast.error(t('common.unexpectedResponse'));
        return;
      }
      setBundle(parsed.data);
      setTasks(bundleToDrafts(parsed.data));
      toast.success(t('taskSplit.bundleSaved'));
    } catch {
      toast.error(t('common.networkError'));
    } finally {
      setSaving(false);
    }
  };

  const runGenerate = async (mode: 'template' | 'ai') => {
    if (!selectedLineId || isLocked) return;
    const setBusy = mode === 'template' ? setGeneratingTemplate : setGeneratingAi;
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/task-split/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userStoryLineId: selectedLineId, mode }),
      });
      if (res.status === 402) {
        toast.error(t('taskSplit.insufficientCreditsAi'));
        return;
      }
      if (!res.ok) {
        const body: { error?: string } = await res.json().catch(() => ({}));
        toast.error(body.error ?? t('taskSplit.generationFailed'));
        return;
      }
      const raw: unknown = await res.json();
      const parsed = GenerateTaskSplitDraftResponseSchema.safeParse(raw);
      if (!parsed.success) {
        toast.error(t('common.unexpectedResponse'));
        return;
      }
      setTasks(
        normalizeSortOrders(
          parsed.data.tasks.map((t) => ({
            sortOrder: t.sortOrder,
            title: t.title,
            promptBody: t.promptBody,
            manual: t.manual ?? false,
          }))
        )
      );
      toast.success(mode === 'ai' ? t('taskSplit.aiTasksGenerated') : t('taskSplit.templateTasksReady'));
    } catch {
      toast.error(t('common.networkError'));
    } finally {
      setBusy(false);
    }
  };

  const handleLock = async () => {
    if (!bundle || isLocked) return;
    setLocking(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/task-split/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleId: bundle.id }),
      });
      if (!res.ok) {
        const body: { error?: string } = await res.json().catch(() => ({}));
        toast.error(body.error ?? t('taskSplit.lockFailed'));
        return;
      }
      const raw: unknown = await res.json();
      const parsed = TaskSplitBundleSchema.safeParse(raw);
      if (!parsed.success) {
        toast.error(t('common.unexpectedResponse'));
        return;
      }
      setBundle(parsed.data);
      setTasks(bundleToDrafts(parsed.data));
      toast.success(t('taskSplit.bundleLocked'));
    } catch {
      toast.error(t('common.networkError'));
    } finally {
      setLocking(false);
    }
  };

  const moveTask = (index: number, direction: -1 | 1) => {
    const next = [...tasks];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    setTasks(normalizeSortOrders(next));
  };

  const selectedStory = eligibleStories.find((s) => s.lineId === selectedLineId);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <FadeIn>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href={`/dashboard/projects/${projectId}`}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {projectName}
            </Link>
            <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              {t('taskSplit.title')}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
              {t('taskSplit.subtitle')}
            </p>
          </div>
        </div>
      </FadeIn>

      {loadingStories ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('taskSplit.loadingReviewReadyStories')}
        </div>
      ) : eligibleStories.length === 0 ? (
        <Alert>
          <AlertTitle>{t('taskSplit.noReviewReadyStoriesTitle')}</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{t('taskSplit.noReviewReadyStoriesDescription')}</p>
            <Button asChild variant="outline" size="sm" className="min-h-11">
              <Link href={`/dashboard/projects/${projectId}/user-stories`}>{t('taskSplit.goToUserStories')}</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('taskSplit.selectStory')}</CardTitle>
              <CardDescription>{t('taskSplit.selectStoryDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {eligibleStories.map((story) => (
                <button
                  key={story.lineId}
                  type="button"
                  onClick={() => setSelectedLineId(story.lineId)}
                  className={`w-full text-left rounded-lg border px-4 py-3 transition-colors min-h-11 touch-manipulation ${
                    selectedLineId === story.lineId
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <p className="font-medium text-sm">{story.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{story.clusterLabel}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{story.excerpt}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          {selectedLineId && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{selectedStory?.title ?? t('taskSplit.tasks')}</CardTitle>
                    <CardDescription>
                      {isLocked
                        ? t('taskSplit.lockedDescription')
                        : t('taskSplit.editFlowDescription')}
                    </CardDescription>
                  </div>
                  {isLocked && (
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="h-3 w-3" />
                      {t('taskSplit.locked')}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingBundle ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('taskSplit.loadingBundle')}
                  </div>
                ) : (
                  <>
                    {!isLocked && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="min-h-11"
                          disabled={generatingTemplate || generatingAi}
                          onClick={() => void runGenerate('template')}
                        >
                          {generatingTemplate ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Wand2 className="h-4 w-4 mr-2" />
                          )}
                          {t('taskSplit.templateTasks')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="min-h-11"
                          disabled={generatingTemplate || generatingAi}
                          onClick={() => void runGenerate('ai')}
                        >
                          {generatingAi ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                          )}
                          {t('taskSplit.aiTasks')}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="min-h-11"
                          disabled={generatingTemplate || generatingAi}
                          onClick={() => setTasks((prev) => normalizeSortOrders([...prev, emptyTask(prev.length)]))}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {t('taskSplit.manualTask')}
                        </Button>
                      </div>
                    )}

                    <div className="space-y-3">
                      {tasks.map((task, index) => (
                        <Collapsible key={`${task.id ?? 'new'}-${index}`} defaultOpen={index === 0}>
                          <div className="rounded-lg border p-3 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <CollapsibleTrigger asChild>
                                <Button type="button" variant="ghost" size="sm" className="h-8 px-2">
                                  <ChevronDown className="h-4 w-4" />
                                  <span className="sr-only">{t('taskSplit.togglePrompt')}</span>
                                </Button>
                              </CollapsibleTrigger>
                              <span className="text-xs text-muted-foreground font-mono">#{index + 1}</span>
                              {task.manual && (
                                <Badge variant="outline" className="text-xs">
                                  {t('taskSplit.manual')}
                                </Badge>
                              )}
                              {!isLocked && (
                                <div className="ml-auto flex gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={index === 0}
                                    onClick={() => moveTask(index, -1)}
                                    aria-label={t('taskSplit.moveUp')}
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={index === tasks.length - 1}
                                    onClick={() => moveTask(index, 1)}
                                    aria-label={t('taskSplit.moveDown')}
                                  >
                                    <ArrowDown className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() =>
                                      setTasks((prev) =>
                                        normalizeSortOrders(prev.filter((_, i) => i !== index))
                                      )
                                    }
                                    aria-label={t('taskSplit.deleteTask')}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`task-title-${index}`}>{t('common.title')}</Label>
                              <Input
                                id={`task-title-${index}`}
                                value={task.title}
                                disabled={isLocked}
                                onChange={(e) =>
                                  setTasks((prev) =>
                                    prev.map((t, i) =>
                                      i === index ? { ...t, title: e.target.value } : t
                                    )
                                  )
                                }
                              />
                            </div>
                            <CollapsibleContent>
                              <div className="space-y-2">
                                <Label htmlFor={`task-prompt-${index}`}>{t('taskSplit.cursorPrompt')}</Label>
                                <Textarea
                                  id={`task-prompt-${index}`}
                                  value={task.promptBody}
                                  disabled={isLocked}
                                  rows={6}
                                  className="font-mono text-xs"
                                  onChange={(e) =>
                                    setTasks((prev) =>
                                      prev.map((t, i) =>
                                        i === index ? { ...t, promptBody: e.target.value } : t
                                      )
                                    )
                                  }
                                />
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {!isLocked && (
                        <>
                          <Button
                            type="button"
                            className="min-h-11"
                            disabled={saving || locking}
                            onClick={() => void handleSave()}
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            {t('taskSplit.saveBundle')}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className="min-h-11"
                            disabled={saving || locking || !bundle}
                            onClick={() => void handleLock()}
                          >
                            {locking ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Lock className="h-4 w-4 mr-2" />
                            )}
                            {t('taskSplit.lockForDelivery')}
                          </Button>
                        </>
                      )}
                      {isLocked && (
                        <Button asChild className="min-h-11">
                          <Link href={`/dashboard/projects/${projectId}/delivery`}>
                            <Package className="h-4 w-4 mr-2" />
                            {t('taskSplit.openDeliveryExport')}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
