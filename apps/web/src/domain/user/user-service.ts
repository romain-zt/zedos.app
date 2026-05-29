/**
 * User Domain Service
 * 
 * Coordinates domain logic involving users.
 * Pure functions; no I/O; depends only on domain and Result.
 */

import { User, Email, UserId } from './user';
import { Result, ok, err } from '@repo/result';
import { ValidationError } from '@shared/errors/application-error';
import * as bcrypt from 'bcryptjs';

export class UserDomainService {
  /**
   * Hash a password for storage
   */
  static async hashPassword(password: string): Promise<Result<string, ValidationError>> {
    if (!password || password.length < 8) {
      return err(new ValidationError('Password must be at least 8 characters'));
    }

    try {
      const hash = await bcrypt.hash(password, 10);
      return ok(hash);
    } catch (error) {
      return err(new ValidationError('Failed to hash password'));
    }
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<Result<boolean>> {
    try {
      const isValid = await bcrypt.compare(password, hash);
      return ok(isValid);
    } catch (error) {
      return ok(false);
    }
  }

  /**
   * Validate email format
   */
  static validateEmail(emailStr: string): Result<Email, ValidationError> {
    try {
      const email = new Email(emailStr);
      return ok(email);
    } catch (error) {
      return err(new ValidationError('Invalid email format'));
    }
  }

  /**
   * Create a new user entity
   */
  static createUser(
    id: string,
    email: Email,
    name: string,
    passwordHash: string
  ): User {
    return {
      id,
      email: email.value,
      name: name || null,
      passwordHash,
      creditBalance: 0,
      graceUsed: false,
      starterCreditsGranted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
