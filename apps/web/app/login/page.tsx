'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession, getSession } from '@repo/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthLayout } from '@/components/layouts/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useI18n } from '@/src/i18n'
import { AnalyticsEvents } from '@infrastructure/analytics/analytics-events'
import { captureClient, identifyClient } from '@infrastructure/analytics/posthog-client'

export default function LoginPage() {
  const { tp } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, isPending } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const callbackUrl =
    searchParams.get('callbackUrl') ??
    searchParams.get('from') ??
    '/dashboard'

  useEffect(() => {
    if (!isPending && session) {
      router.replace(callbackUrl)
    }
  }, [session, isPending, router, callbackUrl])

  if (isPending || session) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      toast.error(tp('fillAllFields', 'Please fill in all fields'))
      return
    }
    setLoading(true)
    try {
      const result = await signIn.email({
        email: email.toLowerCase().trim(),
        password,
      })
      if (result.error) {
        captureClient(AnalyticsEvents.SIGN_IN_FAILED, {
          error_code: result.error.code ?? 'sign_in_failed',
        })
        toast.error(tp('invalidCredentials', 'Invalid email or password'))
      } else {
        const session = await getSession()
        const userId = session.data?.user?.id
        if (userId) {
          identifyClient(userId)
          captureClient(AnalyticsEvents.SIGN_IN_COMPLETED, {})
        }
        router.replace(callbackUrl)
      }
    } catch {
      captureClient(AnalyticsEvents.SIGN_IN_FAILED, { error_code: 'unexpected_error' })
      toast.error(tp('somethingWentWrong', 'Something went wrong'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title={tp('title', 'Welcome back')}
      description={tp('description', 'Sign in to continue building your PRDs')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{tp('emailLabel', 'Email')}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="off"
              placeholder={tp('emailPlaceholder', 'you@example.com')}
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{tp('passwordLabel', 'Password')}</Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
              {tp('forgotPassword', 'Forgot password?')}
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete="off"
              placeholder={tp('passwordPlaceholder', 'Enter your password')}
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          {tp('submit', 'Sign In')}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {tp('noAccount', "Don’t have an account?")}{' '}
        <Link href="/signup" className="text-primary hover:underline font-medium">
          {tp('signupCta', 'Sign up')}
        </Link>
      </p>
    </AuthLayout>
  )
}
