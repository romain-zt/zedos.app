'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FadeIn } from '@/components/ui/animate';
import { Download, Eye, Loader2, Lock, Package } from 'lucide-react';
import {
  ExportEligibleListResponseSchema,
  DeliveryPreviewResponseSchema,
  type ExportEligibleBundleDTO,
  type DeliveryPreviewStoryDTO,
} from '@repo/contracts/delivery';

interface Props {
  projectId: string;
  projectName: string;
}

export function DeliveryExportWorkspace({ projectId, projectName }: Props) {
  const apiBase = `/api/projects/${projectId}/delivery`;

  const [bundles, setBundles] = useState<ExportEligibleBundleDTO[]>([]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [preview, setPreview] = useState<DeliveryPreviewStoryDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewing, setPreviewing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEligible = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/eligible`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Could not load export-ready bundles');
      const parsed = ExportEligibleListResponseSchema.safeParse(await res.json());
      if (!parsed.success) throw new Error('Unexpected response');
      const loaded = parsed.data.bundles;
      setBundles(loaded);
      setSelected(new Set(loaded.map((b) => b.id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load bundles');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    void loadEligible();
  }, [loadEligible]);

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  const toggle = (id: string) => {
    setPreview(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setPreview(null);
    setSelected(new Set(bundles.map((b) => b.id)));
  };

  const clearSelection = () => {
    setPreview(null);
    setSelected(new Set());
  };

  const handlePreview = async () => {
    if (selectedIds.length === 0) return;
    setPreviewing(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleIds: selectedIds }),
      });
      const raw = await res.json();
      if (!res.ok) throw new Error(raw?.error ?? 'Preview failed');
      const parsed = DeliveryPreviewResponseSchema.safeParse(raw);
      if (!parsed.success) throw new Error('Unexpected preview response');
      setPreview(parsed.data.stories);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  const handleExport = async () => {
    if (selectedIds.length === 0) return;
    setExporting(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleIds: selectedIds }),
      });
      if (!res.ok) {
        const raw = await res.json().catch(() => ({}));
        throw new Error(raw?.error ?? 'Export failed');
      }
      const blob = await res.blob();
      const filename = parseFilename(res.headers.get('Content-Disposition')) ?? 'cursor-package.zip';
      triggerDownload(blob, filename);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-1 sm:px-0">
        <Header projectName={projectName} />
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading export-ready task bundles…
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-1 sm:px-0">
      <FadeIn>
        <Header projectName={projectName} />
      </FadeIn>

      {error && (
        <p className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {bundles.length === 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Nothing to export yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Delivery packages are built from <strong>locked</strong> task bundles. Split a story into
              tasks and lock the bundle, then come back here to download a Cursor-ready package.
            </p>
            <Button asChild variant="outline" className="min-h-11">
              <Link href={`/dashboard/projects/${projectId}/task-split`}>Go to task splitting</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium">Locked task bundles</span>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="ghost" size="sm" className="min-h-11" onClick={selectAll}>
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-11"
                  onClick={clearSelection}
                  disabled={selected.size === 0}
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {bundles.map((b) => {
                const checked = selected.has(b.id);
                return (
                  <label
                    key={b.id}
                    htmlFor={`bundle-${b.id}`}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                      checked ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <Checkbox
                      id={`bundle-${b.id}`}
                      checked={checked}
                      onCheckedChange={() => toggle(b.id)}
                      className="mt-0.5 h-5 w-5"
                      aria-label={`Include ${b.storyTitle} in the export`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{b.storyTitle}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Locked
                        </Badge>
                        <span>
                          {b.taskCount} {b.taskCount === 1 ? 'task' : 'tasks'}
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={selected.size === 0 || previewing || exporting}
              onClick={handlePreview}
            >
              {previewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              <span className="ml-2">Preview</span>
            </Button>
            <Button
              type="button"
              className="min-h-11"
              disabled={selected.size === 0 || exporting || previewing}
              onClick={handleExport}
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span className="ml-2">
                {exporting ? 'Building…' : `Download Cursor package${selected.size > 0 ? ` (${selected.size})` : ''}`}
              </span>
            </Button>
          </div>

          {preview && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Package preview</p>
              {preview.map((story) => (
                <Card key={story.bundleId}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{story.storyTitle}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {story.tasks.map((task) => (
                      <div key={task.id} className="rounded-md border bg-muted/30 p-2">
                        <p className="text-sm font-medium">
                          {task.sortOrder + 1}. {task.title}
                        </p>
                        {task.promptExcerpt && (
                          <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{task.promptExcerpt}</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Header({ projectName }: { projectName: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Package className="h-5 w-5" />
      </div>
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">Delivery</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {projectName} — package locked tasks into a Cursor-ready export.
        </p>
      </div>
    </div>
  );
}

function parseFilename(disposition: string | null): string | null {
  if (!disposition) return null;
  const match = /filename="?([^"]+)"?/.exec(disposition);
  return match?.[1] ?? null;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
