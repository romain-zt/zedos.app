import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { GetProjectUseCase } from '@application/project/get-project-usecase'
import { PrismaProjectRepository } from '@infrastructure/persistence/project-repository'
import { OwnerMilestonePromptProvider } from './_components/owner-milestone-prompt'

export default async function ProjectWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  const userResult = await requireUser(headers())
  if (userResult.isErr()) redirect('/sign-in')
  const userId = userResult.unwrap().id

  const repo = new PrismaProjectRepository()
  const useCase = new GetProjectUseCase(repo)
  const result = await useCase.execute(params.id, userId)

  if (result.isErr()) redirect('/dashboard/projects')

  const project = result.unwrap()
  const isOwner = project.userId === userId

  return (
    <OwnerMilestonePromptProvider projectId={project.id} enabled={isOwner}>
      {children}
    </OwnerMilestonePromptProvider>
  )
}
