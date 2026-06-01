'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FadeIn } from '@/components/ui/animate';
import { toast } from 'sonner';
import {
  ExportEligibleListResponseSchema,
  DeliveryPreviewResponseSchema,
  type ExportEligibleBundleDTO,
  type DeliveryPreviewResponse,
} from '@repo/contracts/delivery';
import {
  ArrowLeft,
  Download,
  Eye,
  FileArchive,
  Info,
  Loader2,
  Package,
  AlertTriangle,
} from 'lucide-react';

interface DeliveryExportWorkspaceProps {
  projectId: string;
  projectName: string;
}

type LoadState = 'idle' | 'loading' | 'error';

export function DeliveryExportWorkspace({ projectId, projectName }: DeliveryExportWorkspaceProps) {
  const [bundles, setBundles] = useState<ExportEligibleBundleDTO[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [listState, setListState] = useState<LoadState>('loading');
  const [listError, setListError] = useState<string | null>(null);
  const [preview, setPreview] = useState<DeliveryPreviewResponse | null>(null);
  const [previewState, setPreviewState] = useState<LoadState>('idle');
  const [exporting, setExporting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const loadEligible = useCallback(async () => {
    setListState('loading');
    setListError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/delivery/eligible`);
      if (res.status === 401) {
        setListError('Please sign in again.');
        setBundles([]);
        return;
      }
      if (!res.ok) {
        setListError(`Could not load export-ready stories (HTTP ${res.status}).`);
        setBundles([]);
        return;
      }
      const raw: unknown = await res.json();
      const parsed = ExportEligibleListResponseSchema.safeParse(raw);
      if (!parsed.success) {
        setListError('Unexpected response from server.');
        setBundles([]);
        return;
      }
      const items = parsed.data.bundles;
      setBundles(items);
      setSelectedIds(new Set(items.map((b) => b.id)));
      setPreview(null);
    } catch (e) {
      const detail = e instanceof Error ? e.message : 'Network error';
      setListError(detail);
      setBundles([]);
    } finally {
      setListState('idle');
    }
  }, [projectId]);

  useEffect(() => {
    void loadEligible();
  }, [loadEligible]);

  const selectedArray = useMemo(() => Array.from(selectedIds), [selectedIds]);
  const allSelected = bundles.length > 0 && selectedArray.length === bundles.length;

  const toggleBundle = (id: string, checked: boolean) => {
    setValidationError(null);
    setPreview(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setValidationError(null);
    setPreview(null);
    if (checked) setSelectedIds(new Set(bundles.map((b) => b.id)));
    else setSelectedIds(new Set());
  };

  const runPreview = async () => {
    if (selectedArray.length < 1) {
      setValidationError('Select at least one story bundle to preview.');
      return;
    }
    setValidationError(null);
    setPreviewState('loading');
    setPreview(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/delivery/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleIds: selectedArray }),
      });
      if (!res.ok) {
        const body: unknown = await res.json().catch(() => ({}));
        const message =
          typeof body === 'object' &&
          body !== null &&
          'error' in body &&
          typeof (body as { error: unknown }).error === 'string'
            ? (body as { error: string }).error
            : `Preview failed (HTTP ${res.status})`;
        toast.error(message);
        setPreviewState('error');
        return;
      }
      const raw: unknown = await res.json();
      const parsed = DeliveryPreviewResponseSchema.safeParse(raw);
      if (!parsed.success) {
        toast.error('Unexpected preview response');
        setPreviewState('error');
        return;
      }
      setPreview(parsed.data);
      setPreviewState('idle');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Preview failed');
      setPreviewState('error');
    }
  };

  const runExport = async () => {
    if (selectedArray.length < 1) {
      setValidationError('Select at least one story bundle to export.');
      return;
    }
    if (exporting) return;
    setValidationError(null);
    setExporting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/delivery/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleIds: selectedArray }),
      });
      if (!res.ok) {
        const body: unknown = await res.json().catch(() => ({}));
        const message =
          typeof body === 'object' &&
          body !== null &&
          'error' in body &&
          typeof (body as { error: unknown }).error === 'string'
            ? (body as { error: string }).error
            : `Export failed (HTTP ${res.status})`;
        toast.error(message);
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition');
      const filenameMatch = disposition?.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? `zedos-delivery-${projectId.slice(0, 8)}.zip`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('Package downloaded — unzip into your repo root and open in Cursor.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const isEmpty = listState !== 'loading' && bundles.length === 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Button variant="ghost" size="sm" className="mb-2 -ml-2 min-h-11" asChild>
              <Link href={`/dashboard/projects/${projectId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to workspace
              </Link>
            </Button>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Package className="h-7 w-7 text-primary shrink-0" />
              Cursor delivery
            </h1>
            <p className="mt-1 text-muted-foreground text-sm sm:text-base">
              Export locked story bundles for <span className="font-medium text-foreground">{projectName}</span> as a
              ZIP with <code className="text-xs">WORK_QUEUE.md</code> and per-story prompt files (PD-001).
            </p>
          </div>
        </div>
      </FadeIn>

      {listError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Could not load bundles</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{listError}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void loadEligible()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {listState === 'loading' && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading export-ready stories…
        </div>
      )}

      {isEmpty && !listError && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">No export-ready bundles yet</CardTitle>
            <CardDescription>
              Delivery needs <strong>locked</strong> task-split bundles from test-first workflows. Complete user stories,
              generate tasks with prompts, then lock each bundle upstream.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="default" className="min-h-11">
              <Link href={`/dashboard/projects/${projectId}/task-split`}>Go to task split</Link>
            </Button>
            <Button asChild variant="outline" className="min-h-11">
              <Link href={`/dashboard/projects/${projectId}/user-stories`}>User stories</Link>
            </Button>
            <Button asChild variant="outline" className="min-h-11">
              <Link href={`/dashboard/projects/${projectId}/feature-split`}>Feature split</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!isEmpty && listState !== 'loading' && bundles.length > 0 && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Select bundles</CardTitle>
              <CardDescription>
                Only locked, export-ready story bundles appear here. Default selection includes all eligible bundles.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 border-b pb-3">
                <Checkbox
                  id="select-all-bundles"
                  checked={allSelected}
                  onCheckedChange={(v) => toggleAll(v === true)}
                  aria-label="Select all bundles"
                />
                <label htmlFor="select-all-bundles" className="text-sm font-medium cursor-pointer">
                  Select all ({bundles.length})
                </label>
              </div>
              <ul className="space-y-2">
                {bundles.map((bundle) => (
                  <li
                    key={bundle.id}
                    className="flex items-start gap-3 rounded-lg border px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <Checkbox
                      id={`bundle-${bundle.id}`}
                      checked={selectedIds.has(bundle.id)}
                      onCheckedChange={(v) => toggleBundle(bundle.id, v === true)}
                      aria-label={`Select ${bundle.storyTitle}`}
                    />
                    <div className="flex-1 min-w-0">
                      <label htmlFor={`bundle-${bundle.id}`} className="font-medium cursor-pointer block truncate">
                        {bundle.storyTitle}
                      </label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {bundle.taskCount} task{bundle.taskCount !== 1 ? 's' : ''} · locked{' '}
                        {new Date(bundle.lockedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              {validationError && (
                <p className="text-sm text-destructive" role="alert">
                  {validationError}
                </p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={previewState === 'loading'}
                  onClick={() => void runPreview()}
                >
                  {previewState === 'loading' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="mr-2 h-4 w-4" />
                  )}
                  Preview package
                </Button>
                <Button
                  type="button"
                  className="min-h-11"
                  disabled={exporting}
                  onClick={() => void runExport()}
                >
                  {exporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download ZIP
                </Button>
              </div>
            </CardContent>
          </Card>

          {preview && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileArchive className="h-5 w-5" />
                  Preview (read-only)
                </CardTitle>
                <CardDescription>
                  Ordered stories and task prompt excerpts — upstream content cannot be edited here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {preview.stories.map((story) => (
                  <div key={story.bundleId} className="border rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold">{story.storyTitle}</h3>
                    <ol className="space-y-3 list-none pl-0">
                      {story.tasks.map((task) => (
                        <li key={task.id} className="text-sm border-l-2 border-primary/30 pl-3">
                          <p className="font-medium">
                            {task.sortOrder + 1}. {task.title}
                          </p>
                          <p className="text-muted-foreground mt-1 font-mono text-xs whitespace-pre-wrap">
                            {task.promptExcerpt}
                            {task.promptExcerpt.length >= 500 ? '…' : ''}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>After download</AlertTitle>
            <AlertDescription>
              Unzip the archive at your repository root. Open the folder in Cursor and start from{' '}
              <code className="text-xs">WORK_QUEUE.md</code> — story details live under{' '}
              <code className="text-xs">docs/execution/user-stories/</code>.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}
