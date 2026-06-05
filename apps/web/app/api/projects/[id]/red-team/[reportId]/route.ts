export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { requireUser } from '@repo/auth/guards';
import { RedTeamReportDetailSchema } from '@repo/contracts/ai';
import { GetRedTeamReportUseCase } from '@application/red-team/get-red-team-report-usecase';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleRedTeamReportRepository } from '@infrastructure/persistence/red-team-report-repository';
import { toRedTeamReportDetail } from '../_mappers';

const ParamsSchema = z.object({ id: z.string().min(1), reportId: z.string().min(1) });

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string; reportId: string }> },
): Promise<NextResponse> {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = userResult.unwrap().id;

  const params = ParamsSchema.safeParse(await context.params);
  if (!params.success) return NextResponse.json({ error: 'Invalid params' }, { status: 400 });

  const useCase = new GetRedTeamReportUseCase(
    new DrizzleProjectRepository(),
    new DrizzleRedTeamReportRepository(),
  );
  const result = await useCase.execute(params.data.id, params.data.reportId, userId);
  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.statusCode },
    );
  }
  return NextResponse.json(RedTeamReportDetailSchema.parse(toRedTeamReportDetail(result.unwrap())));
}
