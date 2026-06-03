import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { GetProjectUseCase } from '@application/project/get-project-usecase'
import { PrismaProjectRepository } from '@infrastructure/persistence/project-repository'
import { ProjectWorkspace } from './_components/project-workspace'

export default async function ProjectPage({ params }: { params: { id: string } }) {
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
    />
  )
}
