import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { GetProjectUseCase } from '@application/project/get-project-usecase'
import { PrismaProjectRepository } from '@infrastructure/persistence/project-repository'
import { ProjectWorkspace } from './_components/project-workspace'

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const tabParam = sp.tab
  const initialActiveTab =
    tabParam === 'prd' || (Array.isArray(tabParam) && tabParam.includes('prd')) ? 'prd' : 'clarify'
  const userResult = await requireUser(headers())
  if (userResult.isErr()) redirect('/sign-in')
  const userId = userResult.unwrap().id

  const repo = new PrismaProjectRepository()
  const useCase = new GetProjectUseCase(repo)
  const result = await useCase.execute(params.id, userId)

  if (result.isErr()) redirect('/dashboard/projects')

  const project = result.unwrap()

  return (
    <ProjectWorkspace
      projectId={project.id}
      projectName={project.name}
      projectDescription={project.description}
      initialJourneyMode={project.journeyMode}
      initialActiveTab={initialActiveTab}
    />
  )
}
