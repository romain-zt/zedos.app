import { pgTable, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { projects } from './projects';
import { users } from './users';

export const projectMemberRoles = ['owner', 'editor', 'viewer', 'commenter'] as const;
export type ProjectMemberRole = (typeof projectMemberRoles)[number];

export const projectMemberStatuses = ['pending', 'active'] as const;
export type ProjectMemberStatus = (typeof projectMemberStatuses)[number];

export const projectMembers = pgTable(
  'project_members',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    inviteEmail: text('invite_email').notNull(),
    role: text('role').notNull().default('viewer'),
    status: text('status').notNull().default('pending'),
    invitedByUserId: text('invited_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    acceptedAt: timestamp('accepted_at'),
  },
  (t) => [
    index('project_members_project_id_idx').on(t.projectId),
    index('project_members_user_id_idx').on(t.userId),
    uniqueIndex('project_members_project_email_uidx').on(t.projectId, t.inviteEmail),
  ]
);

export type ProjectMember = typeof projectMembers.$inferSelect;
export type NewProjectMember = typeof projectMembers.$inferInsert;
