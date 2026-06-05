'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import {
  ProjectMemberListResponseSchema,
  COMMENTER_ACTIVE_CAP,
  type ProjectMemberDTO,
} from '@repo/contracts/project/members';
import { useI18n } from '@/src/i18n';
import { AnalyticsEvents } from '@infrastructure/analytics/analytics-events';
import { captureClient } from '@infrastructure/analytics/posthog-client';

interface ProjectMembersPanelProps {
  projectId: string;
}

export function ProjectMembersPanel({ projectId }: ProjectMembersPanelProps) {
  const { t } = useI18n();
  const [members, setMembers] = useState<ProjectMemberDTO[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`);
      if (!res.ok) return;
      const raw: unknown = await res.json();
      const parsed = ProjectMemberListResponseSchema.safeParse(raw);
      if (parsed.success) setMembers(parsed.data.members);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const activeCommenters = useMemo(
    () => members.filter((m) => m.role === 'commenter' && m.status === 'active').length,
    [members],
  );
  const commenters = useMemo(() => members.filter((m) => m.role === 'commenter'), [members]);
  const capReached = activeCommenters >= COMMENTER_ACTIVE_CAP;

  const handleInvite = async () => {
    const normalized = email.trim();
    if (!normalized) return;
    setInviting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteEmail: normalized, role: 'commenter' }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(body.error ?? t('members.inviteFailed'));
        return;
      }
      setEmail('');
      toast.success(t('members.invitationSaved'));
      captureClient(AnalyticsEvents.COMMENTER_INVITED, { project_id: projectId });
      await loadMembers();
    } catch {
      toast.error(t('members.inviteFailed'));
    } finally {
      setInviting(false);
    }
  };

  const handleRevoke = async (memberId: string) => {
    setRevokingId(memberId);
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(body.error ?? t('members.revokeFailed'));
        return;
      }
      toast.success(t('members.revoked'));
      captureClient(AnalyticsEvents.COMMENTER_REVOKED, { project_id: projectId });
      await loadMembers();
    } catch {
      toast.error(t('members.revokeFailed'));
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('members.title')}</CardTitle>
        <CardDescription>
          {t('members.description').replace('{cap}', String(COMMENTER_ACTIVE_CAP))}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            placeholder={t('members.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label={t('members.invite')}
            disabled={capReached}
          />
          <Button
            onClick={() => void handleInvite()}
            disabled={inviting || !email.trim() || capReached}
          >
            {t('members.invite')}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {capReached
            ? t('members.capReached').replace('{cap}', String(COMMENTER_ACTIVE_CAP))
            : t('members.capRemaining')
                .replace('{used}', String(activeCommenters))
                .replace('{cap}', String(COMMENTER_ACTIVE_CAP))}
        </p>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : commenters.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('members.none')}</p>
        ) : (
          <ul className="space-y-2">
            {commenters.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between text-sm border rounded-md px-3 py-2"
              >
                <span className="truncate">{m.inviteEmail}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline">{t('members.commenter')}</Badge>
                  <Badge variant={m.status === 'active' ? 'default' : 'secondary'}>
                    {m.status === 'active' ? t('members.statusActive') : t('members.statusPending')}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('members.revoke')}
                    onClick={() => void handleRevoke(m.id)}
                    disabled={revokingId === m.id}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
