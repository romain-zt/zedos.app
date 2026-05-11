/**
 * User Mapper
 * 
 * Converts between: Domain User ↔ Prisma User ↔ UserDTO
 */

import { Mapper } from '@shared/mappers/mapper';
import { User } from '@domain/user/user';
import { UserDTO } from '@repo/contracts/auth/auth-contracts';

export class UserMapper extends Mapper<User, any, UserDTO> {
  toPersistence(domain: User): any {
    return {
      id: domain.id,
      email: domain.email,
      name: domain.name,
      passwordHash: domain.passwordHash,
      creditBalance: domain.creditBalance,
      graceUsed: domain.graceUsed,
      starterCreditsGranted: domain.starterCreditsGranted,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  toDomain(persistence: any): User {
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
