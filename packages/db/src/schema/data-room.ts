import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { projects } from './projects';
import { users } from './users';

/**
 * Audit row per generated team data room bundle.
 * Stores metadata only; zip bytes are streamed to client and never persisted.
 */
export const dataRoomBundles = pgTable(
  'data_room_bundles',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    generatedByUserId: text('generated_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fileCount: integer('file_count').notNull(),
    byteSize: integer('byte_size').notNull(),
    manifestJson: text('manifest_json').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('data_room_bundles_project_id_idx').on(t.projectId),
    index('data_room_bundles_user_id_idx').on(t.generatedByUserId),
  ],
);

export type DataRoomBundleRow = typeof dataRoomBundles.$inferSelect;
