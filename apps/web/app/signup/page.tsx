'use client'

import { useState, useEffect } from 'react'
import { signUp, signIn, useSession } from '@repo/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthLayout } from '@/components/layouts/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, User, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useI18n } from '@/src/i18n'
import { AnalyticsEvents } from '@infrastructure/analytics/analytics-events'
import { captureClient, identifyClient } from '@infrastructure/analytics/posthog-client'
import { getSession } from '@repo/auth'

export default function SignupPage() {
  const { tp } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, isPending } = useSession()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

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
    if (!name.trim() || !email.trim() || !password) {
      toast.error(tp('fillAllFields', 'Please fill in all fields'))
      return
    }
    if (password.length < 8) {
      toast.error(tp('passwordMin', 'Password must be at least 8 characters'))
      return
    }
    setLoading(true)
    try {
      const signUpResult = await signUp.email({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
      })
      if (signUpResult.error) {
        captureClient(AnalyticsEvents.SIGN_UP_FAILED, {
          error_code: signUpResult.error.code ?? 'sign_up_failed',
        })
        toast.error(signUpResult.error.message ?? tp('signupFailed', 'Signup failed'))
        return
      }
      // Auto sign in
      const result = await signIn.email({
        email: email.toLowerCase().trim(),
        password,
      })
      if (result.error) {
        captureClient(AnalyticsEvents.SIGN_UP_FAILED, {
          error_code: result.error.code ?? 'sign_in_after_signup_failed',
        })
        toast.error(tp('loginAfterSignupFailed', 'Account created but login failed. Please sign in.'))
        router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
      } else {
        const session = await getSession()
        const userId = session.data?.user?.id
        if (userId) {
          identifyClient(userId)
          captureClient(AnalyticsEvents.SIGN_UP_COMPLETED, {})
        }
        router.replace(callbackUrl)
      }
    } catch {
      captureClient(AnalyticsEvents.SIGN_UP_FAILED, { error_code: 'unexpected_error' })
      toast.error(tp('somethingWentWrong', 'Something went wrong'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title={tp('title', 'Create your account')}
      description={tp('description', 'Start turning ideas into PRDs with 20 free credits')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{tp('nameLabel', 'Name')}</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder={tp('namePlaceholder', 'Your name')}
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="password">{tp('passwordLabel', 'Password')}</Label>
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
          {tp('submit', 'Create Account')}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {tp('alreadyAccount', 'Already have an account?')}{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          {tp('signinCta', 'Sign in')}
        </Link>
      </p>
    </AuthLayout>
  )
}
