/**
 * User Mapper
 *
 * Converts between: Domain User ↔ Drizzle User row ↔ UserDTO
 */

import { Mapper } from '@shared/mappers/mapper';
import { User } from '@domain/user/user';
import { UserDTO } from '@repo/contracts/auth/auth-contracts';
import type { User as DbUser } from '@repo/db';

export class UserMapper extends Mapper<User, DbUser, UserDTO> {
  toPersistence(domain: User): DbUser {
    return {
      id: domain.id,
      email: domain.email,
      emailVerified: false,
      image: null,
      name: domain.name ?? '',
      passwordHash: domain.passwordHash,
      creditBalance: domain.creditBalance,
      graceUsed: domain.graceUsed,
      starterCreditsGranted: domain.starterCreditsGranted,
      marketingConsent: false,
      productUpdatesConsent: false,
      consentUpdatedAt: null,
      planTier: 'free',
      hasAttemptedExport: false,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  toDomain(persistence: DbUser): User {
    return {
      id: persistence.id,
      email: persistence.email,
      name: persistence.name,
      passwordHash: persistence.passwordHash ?? '',
      creditBalance: persistence.creditBalance,
      graceUsed: persistence.graceUsed,
      starterCreditsGranted: persistence.starterCreditsGranted,
      createdAt: persistence.createdAt,
      updatedAt: persistence.updatedAt,
    };
  }

  toDTO(domain: User): UserDTO {
    return {
      id: domain.id,
      email: domain.email,
      name: domain.name,
      creditBalance: domain.creditBalance,
    };
  }
}

export const userMapper = new UserMapper();
