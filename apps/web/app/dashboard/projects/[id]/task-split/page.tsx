import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { GetProjectUseCase } from '@application/project/get-project-usecase';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function TaskSplitPage({ params }: { params: { id: string } }) {
  const userResult = await requireUser(headers());
  if (userResult.isErr()) redirect('/sign-in');
  const userId = userResult.unwrap().id;

  const useCase = new GetProjectUseCase(new DrizzleProjectRepository());
  const result = await useCase.execute(params.id, userId);
  if (result.isErr()) redirect('/dashboard/projects');

  const project = result.unwrap();
  const userStoriesHref = `/dashboard/projects/${project.id}/user-stories`;

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-1 sm:px-0">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">Task splitting</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">{project.name}</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Turn stories into tasks</CardTitle>
          <CardDescription className="text-sm">
            Pick a review-ready user story, split it into ordered tasks with prompts, then lock for export.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Start in User stories — mark a story review-ready, then return here to build the task bundle.
          </p>
          <Button asChild className="min-h-11 w-full sm:w-auto">
            <Link href={userStoriesHref}>Open user stories</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
