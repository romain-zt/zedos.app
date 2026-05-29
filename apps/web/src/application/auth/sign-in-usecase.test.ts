import { describe, it, expect, vi, beforeEach, type Mocked } from 'vitest';
import { SignInUseCase } from './sign-in-usecase';
import { ok, err } from '@repo/result';
import { ValidationError, UnauthorizedError } from '@shared/errors/application-error';
import type { IUserRepository } from '@domain/user/user-repository';
import type { User } from '@domain/user/user';
import * as bcrypt from 'bcryptjs';

vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
  hash: vi.fn(),
}));

const makeValidUser = (): User => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  passwordHash: 'hashed-password',
  creditBalance: 50,
  graceUsed: false,
  starterCreditsGranted: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const makeMockUserRepo = (): Mocked<IUserRepository> => ({
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
});

describe('SignInUseCase', () => {
  let userRepo: Mocked<IUserRepository>;
  let useCase: SignInUseCase;

  beforeEach(() => {
    userRepo = makeMockUserRepo();
    useCase = new SignInUseCase(userRepo);
    vi.clearAllMocks();
  });

  it('signs in user successfully with valid credentials', async () => {
    const user = makeValidUser();
    userRepo.findByEmail.mockResolvedValue(ok(user));
    vi.mocked(bcrypt.compare).mockImplementation(() => Promise.resolve(true));

    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'correct-password',
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const dto = result.unwrap();
      expect(dto.id).toBe(user.id);
      expect(dto.email).toBe(user.email);
      expect(dto.name).toBe(user.name);
      expect(dto.creditBalance).toBe(user.creditBalance);
    }
  });

  it('returns error for invalid email format', async () => {
    const result = await useCase.execute({
      email: 'not-an-email',
      password: 'password123',
    });

    expect(result.isErr()).toBe(true);
    expect(userRepo.findByEmail).not.toHaveBeenCalled();
  });

  it('returns UnauthorizedError when user not found', async () => {
    userRepo.findByEmail.mockResolvedValue(err(new ValidationError('Not found')));

    const result = await useCase.execute({
      email: 'nonexistent@example.com',
      password: 'password123',
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(UnauthorizedError);
      expect(result.error.message).toBe('Invalid credentials');
    }
  });

  it('returns UnauthorizedError when password is incorrect', async () => {
    userRepo.findByEmail.mockResolvedValue(ok(makeValidUser()));
    vi.mocked(bcrypt.compare).mockImplementation(() => Promise.resolve(false));

    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'wrong-password',
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(UnauthorizedError);
      expect(result.error.message).toBe('Invalid credentials');
    }
  });

  it('returns generic error message for security (AC-8)', async () => {
    userRepo.findByEmail.mockResolvedValue(err(new ValidationError('Not found')));

    const resultUserNotFound = await useCase.execute({
      email: 'nonexistent@example.com',
      password: 'password123',
    });

    userRepo.findByEmail.mockResolvedValue(ok(makeValidUser()));
    vi.mocked(bcrypt.compare).mockImplementation(() => Promise.resolve(false));

    const resultWrongPassword = await useCase.execute({
      email: 'test@example.com',
      password: 'wrong-password',
    });

    expect(resultUserNotFound.isErr()).toBe(true);
    expect(resultWrongPassword.isErr()).toBe(true);

    if (resultUserNotFound.isErr() && resultWrongPassword.isErr()) {
      expect(resultUserNotFound.error.message).toBe(resultWrongPassword.error.message);
      expect(resultUserNotFound.error.message).toBe('Invalid credentials');
    }
  });

  it('returns UserDTO with creditBalance on success', async () => {
    const user = makeValidUser();
    user.creditBalance = 100;
    userRepo.findByEmail.mockResolvedValue(ok(user));
    vi.mocked(bcrypt.compare).mockImplementation(() => Promise.resolve(true));

    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'correct-password',
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.unwrap().creditBalance).toBe(100);
    }
  });
});
