import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { requireSession } from '@repo/auth/guards'

export default async function Home() {
  const sessionResult = await requireSession(await headers())
  if (sessionResult.isOk()) {
    redirect('/dashboard')
  }
  redirect('/sign-in')
}
