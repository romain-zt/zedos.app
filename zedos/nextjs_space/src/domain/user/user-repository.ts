/**
 * User Repository Port
 * 
 * Defines the contract that infrastructure must implement.
 * Domain never directly imports Prisma; it depends on this interface.
 */

import { User, Email } from './user';
import { Result } from '@shared/result/result';
import { ApplicationError } from '@shared/errors/application-error';

export interface IUserRepository {
  /**
   * Find user by email
   */
  findByEmail(email: Email): Promise<Result<User, ApplicationError>>;

  /**
   * Find user by ID
   */
  findById(userId: string): Promise<Result<User, ApplicationError>>;

  /**
   * Create new user
   */
  create(user: User): Promise<Result<User, ApplicationError>>;

  /**
   * Update user (credits, grace status, etc.)
   */
  update(user: User): Promise<Result<User, ApplicationError>>;
}
