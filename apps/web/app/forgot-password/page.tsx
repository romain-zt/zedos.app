'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/layouts/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/src/i18n';

export default function ForgotPasswordPage() {
  const { tp } = useI18n();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error(tp('emailRequired', 'Email is required'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          redirectTo: '/reset-password',
        }),
      });
      if (!response.ok) {
        toast.error(tp('sendResetFailed', 'Unable to send reset link'));
        return;
      }
      toast.success(tp('resetSent', 'If the account exists, a reset email has been sent.'));
      setEmail('');
    } catch {
      toast.error(tp('somethingWentWrong', 'Something went wrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={tp('title', 'Forgot password')}
      description={tp('description', 'Enter your email to receive a reset link.')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{tp('emailLabel', 'Email')}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder={tp('emailPlaceholder', 'you@example.com')}
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          {tp('submit', 'Send reset link')}
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
