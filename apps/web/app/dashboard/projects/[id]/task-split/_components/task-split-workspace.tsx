'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { TaskSplitBundleDTO, TaskSplitTaskDTO } from '@repo/contracts/task-split';
import { FeatureSplitListResponseSchema } from '@repo/contracts/feature-split/feature-split';
import { UserStoryCorpusSchema } from '@repo/contracts/user-stories';

/** Build a Cursor-ready prompt for a single task derived from a user story. */
function buildTaskPrompt(clusterLabel: string, storyTitle: string, storyBody: string): string {
  const body = storyBody.trim();
  return [
    `Implement the user story "${storyTitle}" (feature area: ${clusterLabel}).`,
    '',
    'Acceptance criteria / details:',
    body.length > 0 ? body : '(Add the acceptance criteria for this story.)',
    '',
    'Guidance:',
    '- Follow the existing project architecture and conventions.',
    '- Add or update tests that prove the acceptance criteria.',
    '- Keep this change focused on this single story.',
  ]
    .join('\n')
    .slice(0, 10_000);
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
}

export function TaskSplitWorkspace({ projectId, projectName }: Props) {
  const [bundle, setBundle] = useState<TaskSplitBundleDTO | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locking, setLocking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

  const generateFromStories = useCallback(async () => {
    setGenerating(true);
    setError(null);
    setNotice(null);
    try {
      const splitRes = await fetch(`/api/projects/${projectId}/feature-split`, { cache: 'no-store' });
      if (!splitRes.ok) throw new Error('Could not load your feature split');
      const splitParsed = FeatureSplitListResponseSchema.safeParse(await splitRes.json());
      if (!splitParsed.success) throw new Error('Unexpected feature-split response');

      const clusters = splitParsed.data
        .filter((split) => split.status === 'confirmed')
        .flatMap((split) => split.clusters)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      if (clusters.length === 0) {
        setError('Confirm a feature split and add user stories first, then generate tasks.');
        return;
      }

      const generated: Task[] = [];
      for (const cluster of clusters) {
        const corpusRes = await fetch(
          `/api/projects/${projectId}/user-stories?featureSplitClusterId=${encodeURIComponent(cluster.id)}`,
          { cache: 'no-store' }
        );
        if (!corpusRes.ok) continue;
        const corpusParsed = UserStoryCorpusSchema.safeParse(await corpusRes.json());
        if (!corpusParsed.success) continue;
        const lines = corpusParsed.data.lines
          .filter((line) => !line.archivedAt)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        for (const line of lines) {
          generated.push({
            sortOrder: generated.length,
            title: `${cluster.label}: ${line.title}`.slice(0, 500),
            promptBody: buildTaskPrompt(cluster.label, line.title, line.body),
            manual: false,
          });
        }
      }

      if (generated.length === 0) {
        setError('No user stories found yet. Open User stories, add some, and save — then generate tasks.');
        return;
      }

      setTasks(generated);
      setNotice(`Generated ${generated.length} task${generated.length === 1 ? '' : 's'} from your user stories. Review, edit, then Save.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate tasks');
    } finally {
      setGenerating(false);
    }
  }, [projectId]);

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
        body: JSON.stringify({ tasks: tasks.map((t, i) => ({ ...t, sortOrder: i })) }),
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

  const isLocked = Boolean(bundle?.lockedAt);
  const userStoriesHref = `/dashboard/projects/${projectId}/user-stories`;

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

      {error && (
        <p className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {notice && (
        <p className="rounded border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">
          {notice}
        </p>
      )}

      {isLocked && (
        <div className="flex flex-col gap-2 rounded-md border bg-muted/40 px-3 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            <Badge variant="secondary">Locked</Badge>
            <span>This bundle is export-ready. Editing requires a new save.</span>
          </span>
          <Button asChild size="sm" className="min-h-11 shrink-0">
            <Link href={`/dashboard/projects/${projectId}/delivery`}>Open delivery export</Link>
          </Button>
        </div>
      )}

      {tasks.length === 0 && !isLocked && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">No tasks yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Turn your user stories into Cursor-ready tasks automatically, or add tasks manually.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={generateFromStories} disabled={generating} className="min-h-11">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span className="ml-2">{generating ? 'Generating…' : 'Generate tasks from user stories'}</span>
              </Button>
              <Button onClick={addTask} variant="outline" className="min-h-11" disabled={generating}>
                Add task manually
              </Button>
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
        <div className="flex flex-col gap-2 sm:flex-row">
          {tasks.length > 0 && (
            <Button onClick={addTask} variant="outline" className="min-h-11 sm:order-first">
              + Add task
            </Button>
          )}
          {tasks.length > 0 && (
            <Button onClick={generateFromStories} variant="outline" disabled={generating || saving} className="min-h-11">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span className="ml-2">{generating ? 'Generating…' : 'Regenerate from stories'}</span>
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
        <Button onClick={() => { setBundle({ ...bundle!, lockedAt: null } as TaskSplitBundleDTO); setSaving(false); }} variant="outline" className="min-h-11">
          Unlock to edit
        </Button>
      )}
    </div>
  );
}
