'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import type { TaskSplitBundleDTO, TaskSplitTaskDTO } from '@repo/contracts/task-split';

interface GenerateOptions {
  sourceUserStoryKey?: string;
  storyTitleSnapshot?: string;
}

interface Task {
  id?: string;
  sortOrder: number;
  title: string;
  promptBody: string;
  manual: boolean;
}

interface Props {
  projectId: string;
  projectName: string;
  /** Optional context passed from user stories page */
  sourceUserStoryKey?: string;
  storyTitleSnapshot?: string;
  /** When set, drives a batch workflow through multiple stories */
  batchStoryTitles?: string[];
}

export function TaskSplitWorkspace({ projectId, projectName, sourceUserStoryKey, storyTitleSnapshot, batchStoryTitles }: Props) {
  const [batchIndex, setBatchIndex] = useState(0);
  const activeBatchTitle = batchStoryTitles?.[batchIndex];
  const [bundle, setBundle] = useState<TaskSplitBundleDTO | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locking, setLocking] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = `/api/projects/${projectId}/task-split`;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiBase, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load bundle');
      const data = await res.json();
      if (data) {
        setBundle(data as TaskSplitBundleDTO);
        setTasks((data as TaskSplitBundleDTO).tasks.map((t: TaskSplitTaskDTO) => ({
          id: t.id,
          sortOrder: t.sortOrder,
          title: t.title,
          promptBody: t.promptBody,
          manual: t.manual,
        })));
      }
    } catch {
      setError('Could not load tasks. Try refreshing.');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => { load(); }, [load]);

  // When advancing to the next batch story, reload the current (now empty) bundle slot
  useEffect(() => {
    if (isBatch && batchIndex > 0) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchIndex]);

  function addTask() {
    setTasks((prev) => [
      ...prev,
      { sortOrder: prev.length, title: '', promptBody: '', manual: true },
    ]);
  }

  function removeTask(idx: number) {
    setTasks((prev) => prev.filter((_, i) => i !== idx).map((t, i) => ({ ...t, sortOrder: i })));
  }

  function updateTask(idx: number, field: keyof Task, value: string) {
    setTasks((prev) => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  }

  function moveTask(idx: number, dir: -1 | 1) {
    setTasks((prev) => {
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next.map((t, i) => ({ ...t, sortOrder: i }));
    });
  }

  async function save() {
    if (tasks.length < 1) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(apiBase, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: tasks.map((t, i) => ({ ...t, sortOrder: i })),
          ...(activeBatchTitle ? { storyTitleSnapshot: activeBatchTitle } : storyTitleSnapshot ? { storyTitleSnapshot } : {}),
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? 'Save failed');
      }
      const data = await res.json();
      setBundle(data as TaskSplitBundleDTO);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function lock() {
    setLocking(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/lock`, { method: 'POST' });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? 'Lock failed');
      }
      const data = await res.json();
      setBundle(data as TaskSplitBundleDTO);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lock failed');
    } finally {
      setLocking(false);
    }
  }

  async function unlock() {
    setUnlocking(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/unlock`, { method: 'POST' });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? 'Unlock failed');
      }
      const data = await res.json();
      setBundle(data as TaskSplitBundleDTO);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unlock failed');
    } finally {
      setUnlocking(false);
    }
  }

  async function generate(opts?: GenerateOptions) {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUserStoryKey: opts?.sourceUserStoryKey ?? sourceUserStoryKey,
          storyTitleSnapshot: opts?.storyTitleSnapshot ?? activeBatchTitle ?? storyTitleSnapshot,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? 'Generation failed');
      }
      const data = await res.json();
      setBundle(data as TaskSplitBundleDTO);
      setTasks((data as TaskSplitBundleDTO).tasks.map((t: TaskSplitTaskDTO) => ({
        id: t.id,
        sortOrder: t.sortOrder,
        title: t.title,
        promptBody: t.promptBody,
        manual: t.manual,
      })));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  const isLocked = Boolean(bundle?.lockedAt);
  const userStoriesHref = `/dashboard/projects/${projectId}/user-stories`;
  const isBatch = batchStoryTitles && batchStoryTitles.length > 0;
  const isLastBatchStory = isBatch && batchIndex >= (batchStoryTitles?.length ?? 0) - 1;

  function advanceBatch() {
    if (!isLastBatchStory) {
      setBatchIndex((i) => i + 1);
      setBundle(null);
      setTasks([]);
      setError(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-1 sm:px-0">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">Task splitting</h1>
          <p className="mt-1 text-sm text-muted-foreground">{projectName}</p>
        </div>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-1 sm:px-0">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">Task splitting</h1>
        <p className="mt-1 text-sm text-muted-foreground">{projectName}</p>
      </div>

      {isBatch && (
        <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Story {batchIndex + 1} of {batchStoryTitles?.length}
            </p>
            {!isLastBatchStory && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="min-h-11 gap-1"
                onClick={advanceBatch}
              >
                Next story <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            {isLastBatchStory && (
              <Button asChild size="sm" variant="ghost" className="min-h-11">
                <Link href={`/dashboard/projects/${projectId}/delivery`}>Go to delivery →</Link>
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {batchStoryTitles?.map((title, i) => (
              <span
                key={i}
                className={`rounded px-2 py-0.5 text-xs ${
                  i === batchIndex
                    ? 'bg-primary text-primary-foreground'
                    : i < batchIndex
                    ? 'bg-muted line-through text-muted-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {title}
              </span>
            ))}
          </div>
          {activeBatchTitle && (
            <p className="text-sm text-muted-foreground">
              Generating tasks for: <strong>{activeBatchTitle}</strong>
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {isLocked && (
        <div className="flex flex-col gap-2 rounded-md border bg-muted/40 px-3 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            <Badge variant="secondary">Locked</Badge>
            <span>This bundle is export-ready.</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {isBatch && !isLastBatchStory && (
              <Button size="sm" variant="outline" className="min-h-11" onClick={advanceBatch}>
                Next story <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            <Button asChild size="sm" className="min-h-11 shrink-0">
              <Link href={`/dashboard/projects/${projectId}/delivery`}>Open delivery export</Link>
            </Button>
          </div>
        </div>
      )}

      {tasks.length === 0 && !isLocked && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">No tasks yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {(activeBatchTitle ?? storyTitleSnapshot)
                ? `Generating tasks for: "${activeBatchTitle ?? storyTitleSnapshot}"`
                : 'Generate tasks from your PRD with AI, add them manually, or return to user stories.'}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => generate()}
                disabled={generating}
                className="min-h-11"
              >
                {generating ? 'Generating…' : 'Generate with AI'}
              </Button>
              <Button onClick={addTask} variant="outline" className="min-h-11">Add task manually</Button>
              <Button asChild variant="ghost" className="min-h-11">
                <Link href={userStoriesHref}>Open user stories</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.map((task, idx) => (
            <Card key={task.id ?? idx} className={isLocked ? 'opacity-70' : ''}>
              <CardContent className="space-y-2 pt-4">
                <div className="flex items-center gap-2">
                  <span className="min-w-6 text-center text-sm font-medium text-muted-foreground">
                    {idx + 1}
                  </span>
                  <Input
                    value={task.title}
                    placeholder="Task title"
                    disabled={isLocked}
                    onChange={(e) => updateTask(idx, 'title', e.target.value)}
                    className="flex-1 text-sm"
                  />
                  {!isLocked && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground"
                        onClick={() => moveTask(idx, -1)}
                        disabled={idx === 0}
                        aria-label="Move up"
                      >↑</Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground"
                        onClick={() => moveTask(idx, 1)}
                        disabled={idx === tasks.length - 1}
                        aria-label="Move down"
                      >↓</Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => removeTask(idx)}
                        aria-label="Remove task"
                      >✕</Button>
                    </div>
                  )}
                </div>
                <Textarea
                  value={task.promptBody}
                  placeholder="Cursor-ready prompt for this task…"
                  disabled={isLocked}
                  onChange={(e) => updateTask(idx, 'promptBody', e.target.value)}
                  rows={3}
                  className="ml-8 text-sm"
                />
                {task.manual && (
                  <p className="ml-8 text-xs text-muted-foreground">Manual task</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLocked && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {tasks.length > 0 && (
            <Button onClick={addTask} variant="outline" className="min-h-11 sm:order-first">
              + Add task
            </Button>
          )}
          {tasks.length > 0 && (
            <Button
              onClick={save}
              disabled={saving || tasks.some((t) => !t.title.trim())}
              className="min-h-11"
            >
              {saving ? 'Saving…' : 'Save tasks'}
            </Button>
          )}
          {tasks.length > 0 && (
            <Button
              onClick={() => generate()}
              disabled={generating || saving}
              variant="outline"
              className="min-h-11"
            >
              {generating ? 'Generating…' : 'Regenerate with AI'}
            </Button>
          )}
          {bundle && tasks.length > 0 && (
            <Button
              onClick={lock}
              disabled={locking || saving}
              variant="secondary"
              className="min-h-11"
            >
              {locking ? 'Locking…' : 'Lock for delivery'}
            </Button>
          )}
        </div>
      )}

      {isLocked && (
        <Button onClick={unlock} disabled={unlocking} variant="outline" className="min-h-11">
          {unlocking ? 'Unlocking…' : 'Unlock to edit'}
        </Button>
      )}
    </div>
  );
}
