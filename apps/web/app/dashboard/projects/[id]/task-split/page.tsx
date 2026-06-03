import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { GetProjectUseCase } from '@application/project/get-project-usecase';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { TaskSplitWorkspace } from './_components/task-split-workspace';
import { redirectIfExpressPostPrdBlocked } from '@/lib/express-post-prd-guard';

export default async function TaskSplitPage({ params }: { params: { id: string } }) {
  const userResult = await requireUser(headers());
  if (userResult.isErr()) redirect('/sign-in');
  const userId = userResult.unwrap().id;

  const useCase = new GetProjectUseCase(new DrizzleProjectRepository());
  const result = await useCase.execute(params.id, userId);
  if (result.isErr()) redirect('/dashboard/projects');

  const project = result.unwrap();
  redirectIfExpressPostPrdBlocked(project);

  return <TaskSplitWorkspace projectId={project.id} projectName={project.name} />;
}
