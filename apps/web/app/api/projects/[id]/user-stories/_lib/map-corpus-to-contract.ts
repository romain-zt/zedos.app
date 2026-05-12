import type { UserStoryCorpusDomain } from '@domain/user-stories/user-story-corpus';

/** Maps domain corpus (incl. line `corpusId`) to HTTP DTO shape for `UserStoryCorpusSchema`. */
export function mapUserStoryCorpusDomainToDto(corpus: UserStoryCorpusDomain) {
  return {
    id: corpus.id,
    projectId: corpus.projectId,
    featureSplitClusterId: corpus.featureSplitClusterId,
    reviewReadyAt: corpus.reviewReadyAt,
    createdAt: corpus.createdAt,
    updatedAt: corpus.updatedAt,
    lines: corpus.lines.map((line) => ({
      id: line.id,
      sortOrder: line.sortOrder,
      title: line.title,
      body: line.body,
      archivedAt: line.archivedAt,
      draftMarker: line.draftMarker,
      createdAt: line.createdAt,
      updatedAt: line.updatedAt,
    })),
  };
}
