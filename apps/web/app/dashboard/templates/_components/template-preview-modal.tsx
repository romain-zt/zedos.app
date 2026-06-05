'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TemplateDetailDTO, TemplateSlug } from '@repo/contracts/templates';
import { ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { useI18n } from '@/src/i18n';

interface TemplatePreviewModalProps {
  slug: TemplateSlug | null;
  onClose: () => void;
}

type LoadState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'loaded'; detail: TemplateDetailDTO };

export function TemplatePreviewModal({ slug, onClose }: TemplatePreviewModalProps) {
  const router = useRouter();
  const { tp } = useI18n();
  const [state, setState] = useState<LoadState>({ kind: 'idle' });

  useEffect(() => {
    if (!slug) {
      setState({ kind: 'idle' });
      return;
    }
    let cancelled = false;
    setState({ kind: 'loading' });
    void (async () => {
      try {
        const res = await fetch(`/api/templates/${encodeURIComponent(slug)}`);
        if (!res.ok) {
          if (!cancelled) {
            setState({
              kind: 'error',
              message: tp('preview.loadFailed', 'Could not load template'),
            });
          }
          return;
        }
        const json: unknown = await res.json();
        if (!cancelled) {
          setState({ kind: 'loaded', detail: json as TemplateDetailDTO });
        }
      } catch {
        if (!cancelled) {
          setState({
            kind: 'error',
            message: tp('preview.networkError', 'Network error loading template'),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, tp]);

  const open = slug !== null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next: boolean) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl rounded-lg">
        {state.kind === 'loading' ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {tp('preview.loading', 'Loading template…')}
          </div>
        ) : state.kind === 'error' ? (
          <div className="flex flex-col items-start gap-3 py-6 text-sm">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>{state.message}</span>
            </div>
            <Button variant="outline" onClick={onClose} className="min-h-11">
              {tp('preview.close', 'Close')}
            </Button>
          </div>
        ) : state.kind === 'loaded' ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display">{state.detail.title}</DialogTitle>
              <DialogDescription>{state.detail.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="capitalize">
                  {state.detail.journeyHint}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {state.detail.category.replace(/-/g, ' ')}
                </Badge>
                <Badge variant="outline">{state.detail.sector}</Badge>
              </div>
              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {tp('preview.sectionsOutline', 'Sections outline')}
                </h4>
                <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {state.detail.sectionsOutline.map((entry) => (
                    <li key={entry.id} className="rounded-md border bg-muted/30 px-3 py-1.5 text-sm">
                      {entry.title}
                    </li>
                  ))}
                </ul>
              </section>
              {state.detail.clarifyHints.length > 0 ? (
                <section>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {tp('preview.clarifyHints', 'Clarify hints')}
                  </h4>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {state.detail.clarifyHints.map((hint, index) => (
                      <li key={index}>{hint}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="ghost" onClick={onClose} className="min-h-11 w-full sm:w-auto">
                  {tp('preview.close', 'Close')}
                </Button>
                <Button
                  className="min-h-11 w-full sm:w-auto"
                  onClick={() => {
                    router.push(
                      `/dashboard/projects?template=${encodeURIComponent(state.detail.slug)}`
                    );
                  }}
                >
                  {tp('preview.use', 'Use this template')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
