/**
 * User Domain Entity
 * 
 * Represents a Zedos user in the domain layer.
 * No Prisma types leak here; this is a pure domain model.
 */

export interface User {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  creditBalance: number;
  graceUsed: boolean;
  starterCreditsGranted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Value Object - represents user identity (cannot be changed)
 */
export class UserId {
  constructor(readonly value: string) {
    if (!value || value.trim() === '') {
      throw new Error('UserId cannot be empty');
    }
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }
}

/**
 * Email Value Object
 */
export class Email {
  constructor(readonly value: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Invalid email format');
    }
  }

  equals(other: Email): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  toString(): string {
    return this.value;
  }
}
