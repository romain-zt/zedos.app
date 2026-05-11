import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { requireSession } from '@repo/auth/guards'
import { DashboardShell } from './_components/dashboard-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sessionResult = await requireSession(await headers())
  if (sessionResult.isErr()) redirect('/sign-in')

  return <DashboardShell>{children}</DashboardShell>
}
