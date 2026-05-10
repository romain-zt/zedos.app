import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { ProjectWorkspace } from './_components/project-workspace'

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id

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
