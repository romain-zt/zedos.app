'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ProjectMemberListResponseSchema,
  type ProjectMemberDTO,
} from '@repo/contracts/project/members';
import { useI18n } from '@/src/i18n';

interface ProjectMembersPanelProps {
  projectId: string;
}

export function ProjectMembersPanel({ projectId }: ProjectMembersPanelProps) {
  const { t } = useI18n();
  const [members, setMembers] = useState<ProjectMemberDTO[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

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

  const handleInvite = async () => {
    if (!email.trim()) return;
    setInviting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteEmail: email.trim(), role }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(body.error ?? t('members.inviteFailed'));
        return;
      }
      setEmail('');
      toast.success(t('members.invitationSaved'));
      await loadMembers();
    } catch {
      toast.error(t('members.inviteFailed'));
    } finally {
      setInviting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('members.title')}</CardTitle>
        <CardDescription>
          {t('members.description')}
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
          />
          <Select value={role} onValueChange={(v: string) => setRole(v as 'editor' | 'viewer')}>
            <SelectTrigger className="sm:w-36">
              <SelectValue placeholder={t('members.role')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">{t('members.viewer')}</SelectItem>
              <SelectItem value="editor">{t('members.editor')}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => void handleInvite()} disabled={inviting || !email.trim()}>
            {t('members.invite')}
          </Button>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('members.none')}</p>
        ) : (
          <ul className="space-y-2">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                <span>{m.inviteEmail}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{m.role}</Badge>
                  <Badge variant={m.status === 'active' ? 'default' : 'secondary'}>{m.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
