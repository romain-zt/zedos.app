/**
 * Drizzle adapter for question_history — clarify flow persistence + list API.
 */

import { Result, ok, err } from '@repo/result';
import { ApplicationError, DatabaseError } from '@shared/errors/application-error';
import { db, questionHistory, eq, asc, type NewQuestionHistory } from '@repo/db';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'QuestionHistoryRepository' });

export class DrizzleQuestionHistoryRepository {
  constructor(_db?: unknown) {}

  async findRecentByProjectId(
    projectId: string,
    limit: number
  ): Promise<Result<typeof questionHistory.$inferSelect[], ApplicationError>> {
    try {
      const rows = await db
        .select()
        .from(questionHistory)
        .where(eq(questionHistory.projectId, projectId))
        .orderBy(asc(questionHistory.createdAt))
        .limit(limit);
      return ok(rows);
    } catch (error) {
      logger.error('Failed to list question history', error);
      return err(new DatabaseError('Failed to load question history'));
    }
  }

  async findAllByProjectId(
    projectId: string
  ): Promise<Result<typeof questionHistory.$inferSelect[], ApplicationError>> {
    try {
      const rows = await db
        .select()
        .from(questionHistory)
        .where(eq(questionHistory.projectId, projectId))
        .orderBy(asc(questionHistory.createdAt));
      return ok(rows);
    } catch (error) {
      logger.error('Failed to list question history', error);
      return err(new DatabaseError('Failed to load question history'));
    }
  }

  async create(data: NewQuestionHistory): Promise<Result<void, ApplicationError>> {
    try {
      await db.insert(questionHistory).values(data);
      return ok(undefined);
    } catch (error) {
      logger.error('Failed to insert question history', error);
      return err(new DatabaseError('Failed to save question history'));
    }
  }
}

export const questionHistoryRepository = new DrizzleQuestionHistoryRepository();
