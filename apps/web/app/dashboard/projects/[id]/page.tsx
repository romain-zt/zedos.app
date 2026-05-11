import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { prisma } from '@/lib/prisma'
import { ProjectWorkspace } from './_components/project-workspace'

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const userResult = await requireUser(headers())
  if (userResult.isErr()) redirect('/login')
  const userId = userResult.unwrap().id

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId },
  })

  if (!project) redirect('/dashboard/projects')

  return (
    <ProjectWorkspace
      projectId={project.id}
      projectName={project.name}
      projectDescription={project.description}
    />
  )
}
