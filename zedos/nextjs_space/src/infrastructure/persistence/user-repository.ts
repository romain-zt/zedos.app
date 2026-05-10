/**
 * Prisma User Repository Adapter
 */

import { IUserRepository } from '@domain/user/user-repository';
import { User, Email } from '@domain/user/user';
import { Result, ok, err } from '@shared/result/result';
import { ApplicationError, NotFoundError, DatabaseError } from '@shared/errors/application-error';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'UserRepository' });

export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findByEmail(email: Email): Promise<Result<User, ApplicationError>> {
    try {
      const prismaUser = await this.prisma.user.findUnique({
        where: { email: email.value },
      });

      if (!prismaUser) {
        return err(new NotFoundError('User not found'));
      }

      const user = this.mapToDomain(prismaUser);
      return ok(user) as any;
    } catch (error) {
      logger.error('Failed to find user by email', error);
      return err(new DatabaseError('Failed to find user'));
    }
  }

  async findById(userId: string): Promise<Result<User, ApplicationError>> {
    try {
      const prismaUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!prismaUser) {
        return err(new NotFoundError('User not found'));
      }

      const user = this.mapToDomain(prismaUser);
      return ok(user) as any;
    } catch (error) {
      logger.error('Failed to find user by id', error);
      return err(new DatabaseError('Failed to find user'));
    }
  }

  async create(user: User): Promise<Result<User, ApplicationError>> {
    try {
      const prismaUser = await this.prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          passwordHash: user.passwordHash,
          creditBalance: user.creditBalance,
          graceUsed: user.graceUsed,
          starterCreditsGranted: user.starterCreditsGranted,
        },
      });

      const createdUser = this.mapToDomain(prismaUser);
      logger.info('User created', { userId: user.id });
      return ok(createdUser) as any;
    } catch (error) {
      logger.error('Failed to create user', error);
      return err(new DatabaseError('Failed to create user'));
    }
  }

  async update(user: User): Promise<Result<User, ApplicationError>> {
    try {
      const prismaUser = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          email: user.email,
          name: user.name || '',
          creditBalance: user.creditBalance,
          graceUsed: user.graceUsed,
          starterCreditsGranted: user.starterCreditsGranted,
          updatedAt: new Date(),
        },
      });

      const updatedUser = this.mapToDomain(prismaUser);
      logger.info('User updated', { userId: user.id });
      return ok(updatedUser) as any;
    } catch (error) {
      logger.error('Failed to update user', error);
      return err(new DatabaseError('Failed to update user'));
    }
  }

  private mapToDomain(prismaUser: any): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      name: prismaUser.name || null,
      passwordHash: prismaUser.passwordHash,
      creditBalance: prismaUser.creditBalance,
      graceUsed: prismaUser.graceUsed,
      starterCreditsGranted: prismaUser.starterCreditsGranted,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  }
}
