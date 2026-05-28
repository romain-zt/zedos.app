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
      toast.error('New email is required');
      return;
    }
    await withLoading('email', async () => {
      const res = await fetch('/api/account/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ newEmail: newEmail.trim().toLowerCase() }),
      });
      if (!res.ok) {
        toast.error('Unable to update email');
        return;
      }
      toast.success('Email updated');
      setNewEmail('');
    });
  };

  const savePassword = async (): Promise<void> => {
    if (!currentPassword || !newPassword) {
      toast.error('Please fill in password fields');
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
        toast.error('Unable to change password');
        return;
      }
      toast.success('Password updated');
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
        toast.error('Unable to save consent settings');
        return;
      }
      toast.success('Consent settings saved');
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
        toast.error('Unable to revoke session');
        return;
      }
      toast.success('Session revoked');
      setSessions((prev) => prev.filter((item) => item.token !== token));
    });
  };

  const exportData = async (): Promise<void> => {
    await withLoading('export', async () => {
      const res = await fetch('/api/account/export');
      if (!res.ok) {
        toast.error('Export is unavailable');
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
      toast.success('Export downloaded');
    });
  };

  const deleteAccount = async (): Promise<void> => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Type DELETE to confirm');
      return;
    }
    if (!deletePassword) {
      toast.error('Password is required');
      return;
    }

    await withLoading('delete', async () => {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (!res.ok) {
        toast.error('Unable to delete account');
        return;
      }
      toast.success('Account deleted');
      window.location.href = '/sign-in';
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Account settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile, security, and privacy rights.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Account</CardTitle>
          <CardDescription>Current email: {session?.user?.email ?? 'N/A'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="newEmail">New email</Label>
            <Input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new-email@example.com"
            />
          </div>
          <Button onClick={() => void saveEmail()} loading={Boolean(loading.email)}>
            Update email
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Security</CardTitle>
          <CardDescription>Change your password and revoke other sessions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <Button onClick={() => void savePassword()} loading={Boolean(loading.password)}>
            Change password
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Privacy consent</CardTitle>
          <CardDescription>Control your communication preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Product emails</p>
              <p className="text-sm text-muted-foreground">Important information about your account.</p>
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
              <p className="font-medium">Marketing emails</p>
              <p className="text-sm text-muted-foreground">News and offers from Zedos.</p>
            </div>
            <Switch
              checked={consent.marketingConsent}
              onCheckedChange={(checked) =>
                setConsent((prev) => ({ ...prev, marketingConsent: checked }))
              }
            />
          </div>
          <Button onClick={() => void saveConsent()} loading={Boolean(loading.consent)}>
            Save consent settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Active sessions</CardTitle>
          <CardDescription>Revoke sessions you do not recognize.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active sessions.</p>
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
                        {item.current ? 'Current' : 'Active'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{item.userAgent ?? 'Unknown user agent'}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Created: {formatSessionDate(item.createdAt)}</span>
                      <span>Expires: {formatSessionDate(item.expiresAt)}</span>
                      <span>IP: {item.ipAddress ?? 'Unknown'}</span>
                    </div>
                  </div>
                  {!item.current && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void revokeSession(item.token)}
                      loading={Boolean(loading[`session:${item.token}`])}
                    >
                      Revoke
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
          <CardTitle className="text-xl">Privacy</CardTitle>
          <CardDescription>Export and deletion of your personal data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={() => void exportData()} loading={Boolean(loading.export)}>
            Export my data
          </Button>
          <div className="border rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-destructive">Permanent account deletion</p>
            <div className="space-y-2">
              <Label htmlFor="deletePassword">Current password</Label>
              <Input
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deleteConfirm">Type DELETE to confirm</Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
              />
            </div>
            <Button variant="destructive" onClick={() => void deleteAccount()} loading={Boolean(loading.delete)}>
              Delete my account
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <Link href="/legal/privacy" className="underline mr-4">
              Privacy policy
            </Link>
            <Link href="/legal/terms" className="underline">
              Terms of use
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
