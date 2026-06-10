import { Result, ok, err } from '@repo/result';
import { ApplicationError, DatabaseError } from '@shared/errors/application-error';
import type { JourneyStateDTO } from '@repo/contracts/project';
import {
  db,
  projects,
  questionHistory,
  prdVersions,
  featureSplits,
  userStoryCorpora,
  userStoryLines,
  taskSplitBundles,
  tickets,
  milestones,
  eq,
  and,
  inArray,
  isNull,
  isNotNull,
  count,
  sql,
} from '@repo/db';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'JourneyStateReader' });

export interface IJourneyStateReader {
  read(projectId: string): Promise<Result<JourneyStateDTO | null, ApplicationError>>;
}

export class DrizzleJourneyStateReader implements IJourneyStateReader {
  async read(projectId: string): Promise<Result<JourneyStateDTO | null, ApplicationError>> {
    try {
      const [project] = await db
        .select({ id: projects.id, journeyMode: projects.journeyMode })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);
      if (!project) return ok(null);

      const [
        questions,
        prds,
        generatedPrds,
        confirmedSplits,
        storyLines,
        lockedBundles,
        ticketCounts,
        milestoneCount,
      ] = await Promise.all([
        db.select({ value: count() }).from(questionHistory).where(eq(questionHistory.projectId, projectId)),
        db.select({ value: count() }).from(prdVersions).where(eq(prdVersions.projectId, projectId)),
        db
          .select({ value: count() })
          .from(prdVersions)
          .where(
            and(
              eq(prdVersions.projectId, projectId),
              inArray(prdVersions.status, ['generated', 'edited', 'final']),
            ),
          ),
        db
          .select({ value: count() })
          .from(featureSplits)
          .where(and(eq(featureSplits.projectId, projectId), eq(featureSplits.status, 'confirmed'))),
        db
          .select({ value: count() })
          .from(userStoryLines)
          .innerJoin(userStoryCorpora, eq(userStoryLines.corpusId, userStoryCorpora.id))
          .where(and(eq(userStoryCorpora.projectId, projectId), isNull(userStoryLines.archivedAt))),
        db
          .select({ value: count() })
          .from(taskSplitBundles)
          .where(and(eq(taskSplitBundles.projectId, projectId), isNotNull(taskSplitBundles.lockedAt))),
        db
          .select({
            total: count(),
            done: sql<number>`count(*) filter (where ${tickets.status} = 'done')::int`,
          })
          .from(tickets)
          .where(eq(tickets.projectId, projectId)),
        db.select({ value: count() }).from(milestones).where(eq(milestones.projectId, projectId)),
      ]);

      return ok({
        projectId,
        journeyMode: project.journeyMode === 'express' ? 'express' : 'standard',
        questionCount: questions[0]?.value ?? 0,
        prdVersionCount: prds[0]?.value ?? 0,
        hasGeneratedPrd: (generatedPrds[0]?.value ?? 0) > 0,
        featureSplitConfirmed: (confirmedSplits[0]?.value ?? 0) > 0,
        storyLineCount: storyLines[0]?.value ?? 0,
        lockedBundleCount: lockedBundles[0]?.value ?? 0,
        ticketCount: ticketCounts[0]?.total ?? 0,
        doneTicketCount: ticketCounts[0]?.done ?? 0,
        milestoneCount: milestoneCount[0]?.value ?? 0,
      });
    } catch (error) {
      logger.error('Failed to read journey state', error);
      return err(new DatabaseError('Failed to read journey state'));
    }
  }
}

export const journeyStateReader = new DrizzleJourneyStateReader();
