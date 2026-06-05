'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, CheckCircle2, RefreshCcw, Send } from 'lucide-react';
import { toast } from 'sonner';
import {
  CommentThreadDTOSchema,
  ListCommentThreadsResponseSchema,
  type CommentThreadDTO,
} from '@repo/contracts/collab/comment-threads';
import { useI18n } from '@/src/i18n';
import { AnalyticsEvents } from '@infrastructure/analytics/analytics-events';
import { captureClient } from '@infrastructure/analytics/posthog-client';

interface SectionCommentsPanelProps {
  projectId: string;
  prdVersionId: string | null;
  sectionId: string;
  sectionTitle: string;
}

function formatRelative(date: Date | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString();
}

export function SectionCommentsPanel({
  projectId,
  prdVersionId,
  sectionId,
}: SectionCommentsPanelProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<CommentThreadDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [resolving, setResolving] = useState(false);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sectionId });
      if (prdVersionId) params.set('prdVersionId', prdVersionId);
      const res = await fetch(`/api/projects/${projectId}/threads?${params.toString()}`);
      if (!res.ok) {
        toast.error(t('comments.loadFailed'));
        return;
      }
      const raw: unknown = await res.json();
      const parsed = ListCommentThreadsResponseSchema.safeParse(raw);
      if (!parsed.success) {
        toast.error(t('comments.loadFailed'));
        return;
      }
      const openThread = parsed.data.threads.find((t1) => t1.status === 'open') ?? null;
      const resolvedThread = parsed.data.threads.find((t1) => t1.status === 'resolved') ?? null;
      setThread(openThread ?? resolvedThread ?? null);
    } catch {
      toast.error(t('comments.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [projectId, prdVersionId, sectionId, t]);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (!open || !thread || !thread.unreadByOwner) return;
    void fetch(`/api/projects/${projectId}/threads/${thread.id}/read`, { method: 'POST' }).then(
      (res) => {
        if (!res.ok) return;
        setThread((prev) => (prev ? { ...prev, unreadByOwner: false } : prev));
      },
    );
  }, [open, thread, projectId]);

  const handlePost = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setPosting(true);
    try {
      const endpoint = thread
        ? `/api/projects/${projectId}/threads/${thread.id}/messages`
        : `/api/projects/${projectId}/threads`;
      const payload = thread
        ? { body: trimmed }
        : { body: trimmed, sectionId, prdVersionId };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(errBody.error ?? t('comments.postFailed'));
        return;
      }
      const raw: unknown = await res.json();
      const parsed = CommentThreadDTOSchema.safeParse(raw);
      if (!parsed.success) {
        toast.error(t('comments.postFailed'));
        return;
      }
      setThread(parsed.data);
      setBody('');
      captureClient(AnalyticsEvents.SECTION_COMMENT_CREATED, {
        project_id: projectId,
        section_id: sectionId,
        thread_status: parsed.data.status,
      });
    } catch {
      toast.error(t('comments.postFailed'));
    } finally {
      setPosting(false);
    }
  };

  const handleResolveToggle = async () => {
    if (!thread) return;
    const nextStatus = thread.status === 'open' ? 'resolved' : 'open';
    setResolving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/threads/${thread.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(errBody.error ?? t('comments.resolveFailed'));
        return;
      }
      const raw: unknown = await res.json();
      const parsed = CommentThreadDTOSchema.safeParse(raw);
      if (!parsed.success) {
        toast.error(t('comments.resolveFailed'));
        return;
      }
      setThread(parsed.data);
      toast.success(
        nextStatus === 'resolved' ? t('comments.resolvedToast') : t('comments.reopenedToast'),
      );
      captureClient(AnalyticsEvents.THREAD_RESOLVED, {
        project_id: projectId,
        section_id: sectionId,
        next_status: nextStatus,
      });
    } catch {
      toast.error(t('comments.resolveFailed'));
    } finally {
      setResolving(false);
    }
  };

  const triggerLabel = useMemo(() => {
    if (!thread) return t('comments.addCta');
    if (thread.status === 'resolved') return t('comments.resolvedBadge');
    return t('comments.openWithCount').replace('{count}', String(thread.messageCount));
  }, [thread, t]);

  return (
    <div className="border-t mt-2 pt-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={() => setOpen((o) => !o)}
        >
          <MessageCircle className="h-3 w-3" />
          {triggerLabel}
        </Button>
        {thread?.unreadByOwner && (
          <Badge variant="default" className="text-[10px] h-4 px-1">
            {t('comments.unread')}
          </Badge>
        )}
      </div>

      {open && (
        <div className="mt-2 space-y-2">
          {loading && (
            <p className="text-xs text-muted-foreground">{t('comments.loading')}</p>
          )}
          {!loading && thread && (
            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {thread.messages.map((m) => (
                <li
                  key={m.id}
                  className="rounded border bg-muted/30 px-3 py-2 text-xs space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={m.authorRole === 'owner' ? 'default' : 'secondary'} className="text-[10px]">
                      {m.authorRole === 'owner' ? t('comments.roleOwner') : t('comments.roleCommenter')}
                    </Badge>
                    <span className="text-muted-foreground">
                      {m.authorEmail ?? t('comments.anonymous')} · {formatRelative(m.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                </li>
              ))}
            </ul>
          )}

          {!loading && (!thread || thread.status === 'open') && (
            <div className="space-y-2">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t('comments.placeholder')}
                rows={3}
                className="text-sm"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {t('comments.postHint')}
                </span>
                <div className="flex items-center gap-2">
                  {thread && thread.status === 'open' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={() => void handleResolveToggle()}
                      disabled={resolving}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {t('comments.resolve')}
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1"
                    onClick={() => void handlePost()}
                    disabled={posting || !body.trim()}
                  >
                    <Send className="h-3 w-3" />
                    {t('comments.send')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!loading && thread && thread.status === 'resolved' && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {t('comments.resolvedAt')}: {formatRelative(thread.resolvedAt)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1"
                onClick={() => void handleResolveToggle()}
                disabled={resolving}
              >
                <RefreshCcw className="h-3 w-3" />
                {t('comments.reopen')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
