import type { CommentThread, CommentMessage } from '@domain/collab/comment-thread';
import { isThreadUnreadByOwner } from '@domain/collab/comment-thread';
import type {
  CommentMessageDTO,
  CommentThreadDTO,
} from '@repo/contracts/collab/comment-threads';
import type { ProjectAccessRole } from './project-access';

function toMessageDto(message: CommentMessage): CommentMessageDTO {
  return {
    id: message.id,
    threadId: message.threadId,
    authorUserId: message.authorUserId,
    authorRole: message.authorRole,
    authorEmail: message.authorEmail,
    body: message.body,
    createdAt: message.createdAt,
  };
}

export interface ThreadDtoOptions {
  viewerRole: ProjectAccessRole;
}

export function toThreadDto(
  thread: CommentThread,
  options: ThreadDtoOptions,
): CommentThreadDTO {
  return {
    id: thread.id,
    projectId: thread.projectId,
    prdVersionId: thread.prdVersionId,
    sectionId: thread.sectionId,
    status: thread.status,
    createdByUserId: thread.createdByUserId,
    createdAt: thread.createdAt,
    resolvedAt: thread.resolvedAt,
    ownerLastReadAt: thread.ownerLastReadAt,
    messageCount: thread.messageCount,
    lastMessageAt: thread.lastMessageAt,
    unreadByOwner: options.viewerRole === 'owner' && isThreadUnreadByOwner(thread),
    messages: thread.messages.map(toMessageDto),
  };
}
