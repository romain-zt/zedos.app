import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { GetProjectUseCase } from '@application/project/get-project-usecase'
import { PrismaProjectRepository } from '@infrastructure/persistence/project-repository'
import { OwnerMilestonePromptShell } from './_components/owner-milestone-prompt'

export default async function ProjectWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  const projectId = params.id

  const userResult = await requireUser(headers())
  if (userResult.isErr()) redirect('/sign-in')
  const userId = userResult.unwrap().id

  const repo = new PrismaProjectRepository()
  const useCase = new GetProjectUseCase(repo)
  const result = await useCase.execute(projectId, userId)

  if (result.isErr()) redirect('/dashboard/projects')

  const project = result.unwrap()

  return <OwnerMilestonePromptShell projectId={project.id}>{children}</OwnerMilestonePromptShell>
}
