import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { requireSession } from '@repo/auth'

export default async function Home() {
  const sessionResult = await requireSession(headers())
  if (sessionResult.isOk()) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
