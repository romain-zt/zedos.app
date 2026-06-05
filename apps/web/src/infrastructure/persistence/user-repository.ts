/**
 * Drizzle User Repository Adapter
 */

import { IUserRepository } from '@domain/user/user-repository';
import { User, Email } from '@domain/user/user';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, NotFoundError, DatabaseError } from '@shared/errors/application-error';
import { db, users, eq, type UserUpdate, type NewUserRow } from '@repo/db';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'UserRepository' });

export class DrizzleUserRepository implements IUserRepository {
  // Constructor kept for API compatibility - argument is ignored since we use the singleton db
  constructor(_db?: unknown) {}

  async findByEmail(email: Email): Promise<Result<User, ApplicationError>> {
    try {
      const [row] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.value))
        .limit(1);

      if (!row) {
        return err(new NotFoundError('User not found'));
      }

      const user = this.mapToDomain(row);
      return ok(user) as Result<User, ApplicationError>;
    } catch (error) {
      logger.error('Failed to find user by email', error);
      return err(new DatabaseError('Failed to find user'));
    }
  }

  async findById(userId: string): Promise<Result<User, ApplicationError>> {
    try {
      const [row] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!row) {
        return err(new NotFoundError('User not found'));
      }

      const user = this.mapToDomain(row);
      return ok(user) as Result<User, ApplicationError>;
    } catch (error) {
      logger.error('Failed to find user by id', error);
      return err(new DatabaseError('Failed to find user'));
    }
  }

  async create(user: User): Promise<Result<User, ApplicationError>> {
    try {
      const insertData: NewUserRow = {
        id: user.id,
        email: user.email,
        name: user.name || '',
        passwordHash: user.passwordHash,
        creditBalance: user.creditBalance,
        graceUsed: user.graceUsed,
        starterCreditsGranted: user.starterCreditsGranted,
      };
      const [row] = await db
        .insert(users)
        .values(insertData)
        .returning();

      const createdUser = this.mapToDomain(row);
      logger.info('User created', { userId: user.id });
      return ok(createdUser) as Result<User, ApplicationError>;
    } catch (error) {
      logger.error('Failed to create user', error);
      return err(new DatabaseError('Failed to create user'));
    }
  }

  async update(user: User): Promise<Result<User, ApplicationError>> {
    try {
      const updateData: UserUpdate = {
        email: user.email,
        name: user.name || '',
        creditBalance: user.creditBalance,
        graceUsed: user.graceUsed,
        starterCreditsGranted: user.starterCreditsGranted,
      };
      const [row] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, user.id))
        .returning();

      if (!row) {
        return err(new NotFoundError('User not found'));
      }

      const updatedUser = this.mapToDomain(row);
      logger.info('User updated', { userId: user.id });
      return ok(updatedUser) as Result<User, ApplicationError>;
    } catch (error) {
      logger.error('Failed to update user', error);
      return err(new DatabaseError('Failed to update user'));
    }
  }

  private mapToDomain(row: typeof users.$inferSelect): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name || null,
      passwordHash: row.passwordHash ?? '',
      creditBalance: row.creditBalance,
      graceUsed: row.graceUsed,
      starterCreditsGranted: row.starterCreditsGranted,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

// Export for backwards compatibility
