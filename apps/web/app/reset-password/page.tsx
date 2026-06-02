'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/layouts/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/src/i18n';

export default function ResetPasswordPage() {
  const { tp } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const token = searchParams.get('token');
  const error = searchParams.get('error');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error(tp('invalidToken', 'Missing or invalid token'));
      return;
    }
    if (password.length < 8) {
      toast.error(tp('passwordMin', 'Password must be at least 8 characters'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });
      if (!response.ok) {
        toast.error(tp('invalidResetLink', 'Invalid or expired reset link'));
        return;
      }

      toast.success(tp('resetSuccess', 'Password reset successful. Please sign in.'));
      router.replace('/login');
    } catch {
      toast.error(tp('somethingWentWrong', 'Something went wrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={tp('title', 'Reset password')}
      description={tp('description', 'Choose a new password for your account.')}
    >
      {error && (
        <p className="mb-4 text-sm text-destructive">
          {tp('expiredLink', 'The reset link is invalid or expired.')}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">{tp('newPasswordLabel', 'New password')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder={tp('passwordPlaceholder', 'At least 8 characters')}
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              className="pl-10"
              minLength={8}
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          {tp('submit', 'Reset password')}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline font-medium">
          {tp('backToLogin', 'Back to login')}
        </Link>
      </p>
    </AuthLayout>
  );
}
