import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { GetProjectUseCase } from '@application/project/get-project-usecase';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { TaskSplitWorkspace } from './_components/task-split-workspace';

interface TaskSplitPageProps {
  params: { id: string };
  searchParams: { storyKey?: string; storyTitle?: string };
}

export default async function TaskSplitPage({ params, searchParams }: TaskSplitPageProps) {
  const userResult = await requireUser(headers());
  if (userResult.isErr()) redirect('/sign-in');
  const userId = userResult.unwrap().id;

  const useCase = new GetProjectUseCase(new DrizzleProjectRepository());
  const result = await useCase.execute(params.id, userId);
  if (result.isErr()) redirect('/dashboard/projects');

  const project = result.unwrap();

  return (
    <TaskSplitWorkspace
      projectId={project.id}
      projectName={project.name}
      sourceUserStoryKey={searchParams.storyKey}
      storyTitleSnapshot={searchParams.storyTitle}
    />
  );
}
