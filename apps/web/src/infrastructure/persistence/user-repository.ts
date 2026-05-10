/**
 * Drizzle User Repository Adapter
 */

import { IUserRepository } from '@domain/user/user-repository';
import { User, Email } from '@domain/user/user';
import { Result, ok, err } from '@shared/result/result';
import { ApplicationError, NotFoundError, DatabaseError } from '@shared/errors/application-error';
import { db, eq, users, type DrizzleDb } from '@repo/db';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'UserRepository' });

type UserRow = typeof users.$inferSelect;

export class DrizzleUserRepository implements IUserRepository {
  constructor(private database: DrizzleDb = db) {}

  async findByEmail(email: Email): Promise<Result<User, ApplicationError>> {
    try {
      const result = await this.database
        .select()
        .from(users)
        .where(eq(users.email, email.value))
        .limit(1);

      if (result.length === 0) {
        return err(new NotFoundError('User not found'));
      }

      const user = this.mapToDomain(result[0]);
      return ok(user) as Result<User, ApplicationError>;
    } catch (error) {
      logger.error('Failed to find user by email', error);
      return err(new DatabaseError('Failed to find user'));
    }
  }

  async findById(userId: string): Promise<Result<User, ApplicationError>> {
    try {
      const result = await this.database
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (result.length === 0) {
        return err(new NotFoundError('User not found'));
      }

      const user = this.mapToDomain(result[0]);
      return ok(user) as Result<User, ApplicationError>;
    } catch (error) {
      logger.error('Failed to find user by id', error);
      return err(new DatabaseError('Failed to find user'));
    }
  }

  async create(user: User): Promise<Result<User, ApplicationError>> {
    try {
      const result = await this.database
        .insert(users)
        .values({
          id: user.id,
          email: user.email,
          name: user.name || '',
          passwordHash: user.passwordHash,
          creditBalance: user.creditBalance,
          graceUsed: user.graceUsed,
          starterCreditsGranted: user.starterCreditsGranted,
        } as typeof users.$inferInsert)
        .returning();

      const createdUser = this.mapToDomain(result[0]);
      logger.info('User created', { userId: user.id });
      return ok(createdUser) as Result<User, ApplicationError>;
    } catch (error) {
      logger.error('Failed to create user', error);
      return err(new DatabaseError('Failed to create user'));
    }
  }

  async update(user: User): Promise<Result<User, ApplicationError>> {
    try {
      const result = await this.database
        .update(users)
        .set({
          email: user.email,
          name: user.name || '',
          creditBalance: user.creditBalance,
          graceUsed: user.graceUsed,
          starterCreditsGranted: user.starterCreditsGranted,
        } as Partial<typeof users.$inferInsert>)
        .where(eq(users.id, user.id))
        .returning();

      if (result.length === 0) {
        return err(new NotFoundError('User not found'));
      }

      const updatedUser = this.mapToDomain(result[0]);
      logger.info('User updated', { userId: user.id });
      return ok(updatedUser) as Result<User, ApplicationError>;
    } catch (error) {
      logger.error('Failed to update user', error);
      return err(new DatabaseError('Failed to update user'));
    }
  }

  private mapToDomain(row: UserRow): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name || null,
      passwordHash: row.passwordHash,
      creditBalance: row.creditBalance,
      graceUsed: row.graceUsed,
      starterCreditsGranted: row.starterCreditsGranted,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

export { DrizzleUserRepository as PrismaUserRepository };
