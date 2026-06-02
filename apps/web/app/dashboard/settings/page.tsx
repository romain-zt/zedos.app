'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from '@repo/auth';
import type {
  ListSessionsResponse,
  UserSession,
} from '@repo/contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useI18n } from '@/src/i18n';

interface ConsentState {
  marketingConsent: boolean;
  productUpdatesConsent: boolean;
}

const formatSessionDate = (isoDate: string): string => {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown date';
  }
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
};

const getSessionDeviceLabel = (userAgent: string | null): string => {
  if (!userAgent) {
    return 'Unknown device';
  }
  const normalized = userAgent.toLowerCase();
  if (normalized.includes('windows')) return 'Windows device';
  if (normalized.includes('macintosh') || normalized.includes('mac os')) return 'macOS device';
  if (normalized.includes('android')) return 'Android device';
  if (normalized.includes('iphone') || normalized.includes('ipad') || normalized.includes('ios')) return 'iOS device';
  if (normalized.includes('linux')) return 'Linux device';
  return 'Browser session';
};

export default function SettingsPage() {
  const { t } = useI18n();
  const { data: session } = useSession() || {};
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [consent, setConsent] = useState<ConsentState>({
    marketingConsent: false,
    productUpdatesConsent: false,
  });
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const withLoading = async (key: string, task: () => Promise<void>): Promise<void> => {
    setLoading((prev) => ({ ...prev, [key]: true }));
    try {
      await task();
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const loadConsentAndSessions = async (): Promise<void> => {
    const consentRes = await fetch('/api/account/consent');
    if (consentRes.ok) {
      const data = (await consentRes.json()) as ConsentState;
      setConsent({
        marketingConsent: data.marketingConsent,
        productUpdatesConsent: data.productUpdatesConsent,
      });
    }

    const sessionsRes = await fetch('/api/account/sessions');
    if (sessionsRes.ok) {
      const data = (await sessionsRes.json()) as ListSessionsResponse;
      setSessions(data.sessions);
    }
  };

  useEffect(() => {
    void loadConsentAndSessions();
  }, []);

  const saveEmail = async (): Promise<void> => {
    if (!newEmail.trim()) {
      toast.error(t('settings.newEmailRequired'));
      return;
    }
    await withLoading('email', async () => {
      const res = await fetch('/api/account/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ newEmail: newEmail.trim().toLowerCase() }),
      });
      if (!res.ok) {
        toast.error(t('settings.updateEmailFailed'));
        return;
      }
      toast.success(t('settings.emailUpdated'));
      setNewEmail('');
    });
  };

  const savePassword = async (): Promise<void> => {
    if (!currentPassword || !newPassword) {
      toast.error(t('settings.fillPasswordFields'));
      return;
    }
    await withLoading('password', async () => {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        }),
      });
      if (!res.ok) {
        toast.error(t('settings.changePasswordFailed'));
        return;
      }
      toast.success(t('settings.passwordUpdated'));
      setCurrentPassword('');
      setNewPassword('');
    });
  };

  const saveConsent = async (): Promise<void> => {
    await withLoading('consent', async () => {
      const res = await fetch('/api/account/consent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(consent),
      });
      if (!res.ok) {
        toast.error(t('settings.saveConsentFailed'));
        return;
      }
      toast.success(t('settings.consentSaved'));
    });
  };

  const revokeSession = async (token: string): Promise<void> => {
    await withLoading(`session:${token}`, async () => {
      const res = await fetch('/api/account/sessions', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        toast.error(t('settings.revokeSessionFailed'));
        return;
      }
      toast.success(t('settings.sessionRevoked'));
      setSessions((prev) => prev.filter((item) => item.token !== token));
    });
  };

  const exportData = async (): Promise<void> => {
    await withLoading('export', async () => {
      const res = await fetch('/api/account/export');
      if (!res.ok) {
        toast.error(t('settings.exportUnavailable'));
        return;
      }
      const content = await res.text();
      const blob = new Blob([content], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'personal-data-export.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t('settings.exportDownloaded'));
    });
  };

  const deleteAccount = async (): Promise<void> => {
    if (deleteConfirm !== 'DELETE') {
      toast.error(t('settings.typeDeleteToConfirm'));
      return;
    }
    if (!deletePassword) {
      toast.error(t('settings.passwordRequired'));
      return;
    }

    await withLoading('delete', async () => {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (!res.ok) {
        toast.error(t('settings.deleteAccountFailed'));
        return;
      }
      toast.success(t('settings.accountDeleted'));
      window.location.href = '/sign-in';
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('settings.accountSection')}</CardTitle>
          <CardDescription>{t('settings.currentEmail')}: {session?.user?.email ?? 'N/A'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="newEmail">{t('settings.newEmail')}</Label>
            <Input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={t('settings.newEmailPlaceholder')}
            />
          </div>
          <Button onClick={() => void saveEmail()} loading={Boolean(loading.email)}>
            {t('settings.updateEmail')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('settings.securitySection')}</CardTitle>
          <CardDescription>{t('settings.securityDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t('settings.currentPassword')}</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('settings.newPassword')}</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <Button onClick={() => void savePassword()} loading={Boolean(loading.password)}>
            {t('settings.changePassword')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('settings.privacyConsentSection')}</CardTitle>
          <CardDescription>{t('settings.privacyConsentDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('settings.productEmails')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.productEmailsDescription')}</p>
            </div>
            <Switch
              checked={consent.productUpdatesConsent}
              onCheckedChange={(checked) =>
                setConsent((prev) => ({ ...prev, productUpdatesConsent: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('settings.marketingEmails')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.marketingEmailsDescription')}</p>
            </div>
            <Switch
              checked={consent.marketingConsent}
              onCheckedChange={(checked) =>
                setConsent((prev) => ({ ...prev, marketingConsent: checked }))
              }
            />
          </div>
          <Button onClick={() => void saveConsent()} loading={Boolean(loading.consent)}>
            {t('settings.saveConsent')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('settings.activeSessions')}</CardTitle>
          <CardDescription>{t('settings.activeSessionsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('settings.noActiveSessions')}</p>
          ) : (
            sessions.map((item) => (
              <div
                key={item.token}
                className="rounded-lg border bg-card/50 px-4 py-3 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{getSessionDeviceLabel(item.userAgent)}</p>
                      <Badge variant={item.current ? 'default' : 'secondary'}>
                        {item.current ? t('settings.current') : t('settings.active')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{item.userAgent ?? t('settings.unknownUserAgent')}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{t('settings.created')}: {formatSessionDate(item.createdAt)}</span>
                      <span>{t('settings.expires')}: {formatSessionDate(item.expiresAt)}</span>
                      <span>IP: {item.ipAddress ?? t('settings.unknown')}</span>
                    </div>
                  </div>
                  {!item.current && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void revokeSession(item.token)}
                      loading={Boolean(loading[`session:${item.token}`])}
                    >
                      {t('settings.revoke')}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('settings.privacySection')}</CardTitle>
          <CardDescription>{t('settings.privacySectionDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={() => void exportData()} loading={Boolean(loading.export)}>
            {t('settings.exportData')}
          </Button>
          <div className="border rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-destructive">{t('settings.permanentDeletion')}</p>
            <div className="space-y-2">
              <Label htmlFor="deletePassword">{t('settings.currentPassword')}</Label>
              <Input
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deleteConfirm">{t('settings.typeDeleteToConfirmLabel')}</Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
              />
            </div>
            <Button variant="destructive" onClick={() => void deleteAccount()} loading={Boolean(loading.delete)}>
              {t('settings.deleteMyAccount')}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <Link href="/legal/privacy" className="underline mr-4">
              {t('settings.privacyPolicy')}
            </Link>
            <Link href="/legal/terms" className="underline">
              {t('settings.termsOfUse')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
