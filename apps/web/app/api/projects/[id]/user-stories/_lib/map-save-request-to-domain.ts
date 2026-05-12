import type { SaveUserStoryCorpusRequest } from '@repo/contracts/user-stories';
import type { SaveUserStoryLineInput } from '@domain/user-stories/user-story-corpus';

/** Zod-validated save payload → domain persist input (same shape; explicit for typing). */
export function mapSaveRequestLinesToDomain(
  lines: SaveUserStoryCorpusRequest['lines']
): SaveUserStoryLineInput[] {
  return lines.map((l) => ({
    ...(l.id !== undefined ? { id: l.id } : {}),
    sortOrder: l.sortOrder,
    title: l.title,
    body: l.body,
    ...(l.archivedAt !== undefined ? { archivedAt: l.archivedAt } : {}),
    ...(l.draftMarker !== undefined ? { draftMarker: l.draftMarker } : {}),
  }));
}
