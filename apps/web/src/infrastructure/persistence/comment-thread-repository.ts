import {
  db,
  projectCommentThreads,
  projectCommentMessages,
  projects,
  users,
  eq,
  and,
  desc,
  inArray,
  type NewCommentThreadRow,
  type NewCommentMessageRow,
} from '@repo/db';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { Result, ok, err } from '@repo/result';
import {
  ApplicationError,
  DatabaseError,
  NotFoundError,
} from '@shared/errors/application-error';
import type {
  CommentMessage,
  CommentThread,
} from '@domain/collab/comment-thread';
import type {
  AppendMessageDraft,
  CreateThreadDraft,
  ICommentThreadRepository,
  ListThreadsFilter,
} from '@domain/collab/comment-thread-repository';
import type {
  CommentAuthorRole,
  CommentThreadStatus,
} from '@repo/contracts/collab/comment-threads';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'CommentThreadRepository' });

type ThreadRow = typeof projectCommentThreads.$inferSelect;
type MessageRow = typeof projectCommentMessages.$inferSelect;

interface ProjectOwnerEmail {
  ownerUserId: string;
  emailsByUserId: Map<string, string>;
}

function mapMessage(
  row: MessageRow,
  ownerUserId: string,
  emailsByUserId: Map<string, string>,
): CommentMessage {
  const role: CommentAuthorRole = row.authorUserId === ownerUserId ? 'owner' : 'commenter';
  return {
    id: row.id,
    threadId: row.threadId,
    authorUserId: row.authorUserId,
    authorRole: role,
    authorEmail: emailsByUserId.get(row.authorUserId) ?? null,
    body: row.body,
    createdAt: row.createdAt,
  };
}

function mapThread(
  threadRow: ThreadRow,
  messages: CommentMessage[],
): CommentThread {
  const status: CommentThreadStatus = threadRow.status === 'resolved' ? 'resolved' : 'open';
  const lastMessageAt = messages.length > 0 ? messages[messages.length - 1].createdAt : null;
  return {
    id: threadRow.id,
    projectId: threadRow.projectId,
    prdVersionId: threadRow.prdVersionId,
    sectionId: threadRow.sectionId,
    status,
    createdByUserId: threadRow.createdByUserId,
    createdAt: threadRow.createdAt,
    resolvedAt: threadRow.resolvedAt ?? null,
    ownerLastReadAt: threadRow.ownerLastReadAt ?? null,
    messageCount: messages.length,
    lastMessageAt,
    messages,
  };
}

async function loadProjectContext(projectId: string): Promise<Result<ProjectOwnerEmail, ApplicationError>> {
  try {
    const [project] = await db
      .select({ userId: projects.userId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return err(new NotFoundError('Project not found'));
    }

    return ok({ ownerUserId: project.userId, emailsByUserId: new Map() });
  } catch (error) {
    logger.error('Failed to load project context', error);
    return err(new DatabaseError('Failed to load project context'));
  }
}

async function hydrateAuthorEmails(
  authorIds: string[],
): Promise<Result<Map<string, string>, ApplicationError>> {
  if (authorIds.length === 0) return ok(new Map());
  try {
    const rows = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(inArray(users.id, authorIds));
    const map = new Map<string, string>();
    for (const row of rows) {
      map.set(row.id, row.email);
    }
    return ok(map);
  } catch (error) {
    logger.error('Failed to hydrate author emails', error);
    return err(new DatabaseError('Failed to load message authors'));
  }
}

export class DrizzleCommentThreadRepository implements ICommentThreadRepository {
  async listForProject(
    projectId: string,
    filter: ListThreadsFilter,
  ): Promise<Result<CommentThread[], ApplicationError>> {
    try {
      const conditions = [eq(projectCommentThreads.projectId, projectId)];
      if (filter.prdVersionId) {
        conditions.push(eq(projectCommentThreads.prdVersionId, filter.prdVersionId));
      }
      if (filter.sectionId) {
        conditions.push(eq(projectCommentThreads.sectionId, filter.sectionId));
      }
      if (filter.status) {
        conditions.push(eq(projectCommentThreads.status, filter.status));
      }

      const threadRows = await db
        .select()
        .from(projectCommentThreads)
        .where(and(...conditions))
        .orderBy(desc(projectCommentThreads.createdAt));

      if (threadRows.length === 0) return ok([]);

      const ctxResult = await loadProjectContext(projectId);
      if (ctxResult.isErr()) return err(ctxResult.error);
      const ctx = ctxResult.unwrap();

      const threadIds = threadRows.map((t) => t.id);
      const messageRows = await db
        .select()
        .from(projectCommentMessages)
        .where(inArray(projectCommentMessages.threadId, threadIds))
        .orderBy(projectCommentMessages.createdAt);

      const authorIds = Array.from(new Set(messageRows.map((m) => m.authorUserId)));
      const emailsResult = await hydrateAuthorEmails(authorIds);
      if (emailsResult.isErr()) return err(emailsResult.error);
      const emails = emailsResult.unwrap();

      const messagesByThread = new Map<string, CommentMessage[]>();
      for (const row of messageRows) {
        const list = messagesByThread.get(row.threadId) ?? [];
        list.push(mapMessage(row, ctx.ownerUserId, emails));
        messagesByThread.set(row.threadId, list);
      }

      return ok(threadRows.map((t) => mapThread(t, messagesByThread.get(t.id) ?? [])));
    } catch (error) {
      logger.error('listForProject failed', error);
      return err(new DatabaseError('Failed to list comment threads'));
    }
  }

  async findById(threadId: string): Promise<Result<CommentThread, ApplicationError>> {
    try {
      const [threadRow] = await db
        .select()
        .from(projectCommentThreads)
        .where(eq(projectCommentThreads.id, threadId))
        .limit(1);
      if (!threadRow) return err(new NotFoundError('Thread not found'));

      const ctxResult = await loadProjectContext(threadRow.projectId);
      if (ctxResult.isErr()) return err(ctxResult.error);
      const ctx = ctxResult.unwrap();

      const messageRows = await db
        .select()
        .from(projectCommentMessages)
        .where(eq(projectCommentMessages.threadId, threadId))
        .orderBy(projectCommentMessages.createdAt);

      const emailsResult = await hydrateAuthorEmails(
        Array.from(new Set(messageRows.map((m) => m.authorUserId))),
      );
      if (emailsResult.isErr()) return err(emailsResult.error);
      const emails = emailsResult.unwrap();

      const messages = messageRows.map((row) => mapMessage(row, ctx.ownerUserId, emails));
      return ok(mapThread(threadRow, messages));
    } catch (error) {
      logger.error('findById failed', error);
      return err(new DatabaseError('Failed to load thread'));
    }
  }

  async findOpenForSection(
    projectId: string,
    prdVersionId: string | null,
    sectionId: string,
  ): Promise<Result<CommentThread | null, ApplicationError>> {
    try {
      const conditions = [
        eq(projectCommentThreads.projectId, projectId),
        eq(projectCommentThreads.sectionId, sectionId),
        eq(projectCommentThreads.status, 'open'),
      ];
      if (prdVersionId) {
        conditions.push(eq(projectCommentThreads.prdVersionId, prdVersionId));
      }

      const [threadRow] = await db
        .select()
        .from(projectCommentThreads)
        .where(and(...conditions))
        .orderBy(desc(projectCommentThreads.createdAt))
        .limit(1);

      if (!threadRow) return ok(null);

      const fullResult = await this.findById(threadRow.id);
      if (fullResult.isErr()) return err(fullResult.error);
      return ok(fullResult.unwrap());
    } catch (error) {
      logger.error('findOpenForSection failed', error);
      return err(new DatabaseError('Failed to find section thread'));
    }
  }

  async createThreadWithFirstMessage(
    draft: CreateThreadDraft,
    body: string,
  ): Promise<Result<CommentThread, ApplicationError>> {
    try {
      const createdId = await db.transaction(async (tx) => {
        const threadInsert: NewCommentThreadRow = {
          projectId: draft.projectId,
          prdVersionId: draft.prdVersionId,
          sectionId: draft.sectionId,
          createdByUserId: draft.createdByUserId,
          status: 'open',
        };
        const [insertedThread] = await tx
          .insert(projectCommentThreads)
          .values(threadInsert)
          .returning({ id: projectCommentThreads.id });
        if (!insertedThread) {
          throw new Error('Failed to insert thread');
        }
        const messageInsert: NewCommentMessageRow = {
          threadId: insertedThread.id,
          authorUserId: draft.createdByUserId,
          body,
        };
        await tx.insert(projectCommentMessages).values(messageInsert);
        return insertedThread.id;
      });

      return this.findById(createdId);
    } catch (error) {
      logger.error('createThreadWithFirstMessage failed', error);
      return err(new DatabaseError('Failed to create thread'));
    }
  }

  async appendMessage(
    draft: AppendMessageDraft,
  ): Promise<Result<CommentThread, ApplicationError>> {
    try {
      const messageInsert: NewCommentMessageRow = {
        threadId: draft.threadId,
        authorUserId: draft.authorUserId,
        body: draft.body,
      };
      await db.insert(projectCommentMessages).values(messageInsert);
      return this.findById(draft.threadId);
    } catch (error) {
      logger.error('appendMessage failed', error);
      return err(new DatabaseError('Failed to append message'));
    }
  }

  async setStatus(
    threadId: string,
    status: CommentThreadStatus,
  ): Promise<Result<CommentThread, ApplicationError>> {
    try {
      const update = {
        status,
        resolvedAt: status === 'resolved' ? new Date() : null,
      } as PgUpdateSetSource<typeof projectCommentThreads>;
      await db
        .update(projectCommentThreads)
        .set(update)
        .where(eq(projectCommentThreads.id, threadId));
      return this.findById(threadId);
    } catch (error) {
      logger.error('setStatus failed', error);
      return err(new DatabaseError('Failed to update thread status'));
    }
  }

  async markOwnerRead(
    threadId: string,
    at: Date,
  ): Promise<Result<CommentThread, ApplicationError>> {
    try {
      const update = {
        ownerLastReadAt: at,
      } as PgUpdateSetSource<typeof projectCommentThreads>;
      await db
        .update(projectCommentThreads)
        .set(update)
        .where(eq(projectCommentThreads.id, threadId));
      return this.findById(threadId);
    } catch (error) {
      logger.error('markOwnerRead failed', error);
      return err(new DatabaseError('Failed to mark thread read'));
    }
  }
}

export const commentThreadRepository = new DrizzleCommentThreadRepository();
