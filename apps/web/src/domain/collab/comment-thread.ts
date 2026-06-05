import type {
  CommentAuthorRole,
  CommentThreadStatus,
} from '@repo/contracts/collab/comment-threads';

export interface CommentMessage {
  id: string;
  threadId: string;
  authorUserId: string;
  authorRole: CommentAuthorRole;
  authorEmail: string | null;
  body: string;
  createdAt: Date;
}

export interface CommentThread {
  id: string;
  projectId: string;
  prdVersionId: string | null;
  sectionId: string;
  status: CommentThreadStatus;
  createdByUserId: string;
  createdAt: Date;
  resolvedAt: Date | null;
  ownerLastReadAt: Date | null;
  messageCount: number;
  lastMessageAt: Date | null;
  messages: CommentMessage[];
}

/** Computes whether a thread is unread for the project owner. */
export function isThreadUnreadByOwner(thread: CommentThread): boolean {
  if (thread.status === 'resolved') return false;
  if (!thread.lastMessageAt) return false;
  if (!thread.ownerLastReadAt) return true;
  return thread.lastMessageAt.getTime() > thread.ownerLastReadAt.getTime();
}
