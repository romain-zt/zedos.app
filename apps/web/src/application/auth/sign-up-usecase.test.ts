import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignUpUseCase } from './sign-up-usecase';
import { ok, err } from '@repo/result';
import { ValidationError, DatabaseError } from '@shared/errors/application-error';
import { Email } from '@domain/user/user';

const makeValidUser = () => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  passwordHash: 'hashed-password',
  creditBalance: 0,
  graceUsed: false,
  starterCreditsGranted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const makeMockUserRepo = () => ({
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
});

const makeMockCreditsRepo = () => ({
  getBalance: vi.fn(),
  addCredits: vi.fn(),
  deductCredits: vi.fn(),
  reverseCredits: vi.fn(),
  recordTransaction: vi.fn(),
  getTransactionHistory: vi.fn(),
  useGracePeriod: vi.fn(),
  findByUserId: vi.fn(),
});

describe('SignUpUseCase', () => {
  let userRepo: ReturnType<typeof makeMockUserRepo>;
  let creditsRepo: ReturnType<typeof makeMockCreditsRepo>;
  let useCase: SignUpUseCase;

  beforeEach(() => {
    userRepo = makeMockUserRepo();
    creditsRepo = makeMockCreditsRepo();
    useCase = new SignUpUseCase(userRepo as any, creditsRepo as any);
  });

  it('creates a new user successfully', async () => {
    userRepo.findByEmail.mockResolvedValue(err(new ValidationError('Not found')));
    userRepo.create.mockResolvedValue(ok(makeValidUser()));
    creditsRepo.addCredits.mockResolvedValue(ok({ balance: 20 }));

    const result = await useCase.execute({
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
    });

    expect(result.isOk()).toBe(true);
    expect(userRepo.create).toHaveBeenCalledOnce();
    expect(creditsRepo.addCredits).toHaveBeenCalledOnce();
  });

  it('returns validation error for invalid email', async () => {
    const result = await useCase.execute({
      email: 'not-an-email',
      password: 'password123',
      name: 'Test User',
    });

    expect(result.isErr()).toBe(true);
    expect(userRepo.findByEmail).not.toHaveBeenCalled();
  });

  it('returns validation error when user already exists', async () => {
    userRepo.findByEmail.mockResolvedValue(ok(makeValidUser()));

    const result = await useCase.execute({
      email: 'existing@example.com',
      password: 'password123',
      name: 'Test User',
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain('already exists');
    }
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('returns validation error for password less than 8 characters', async () => {
    userRepo.findByEmail.mockResolvedValue(err(new ValidationError('Not found')));

    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'short', // 5 characters - too short
      name: 'Test User',
    });

    expect(result.isErr()).toBe(true);
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('propagates user creation error', async () => {
    userRepo.findByEmail.mockResolvedValue(err(new ValidationError('Not found')));
    userRepo.create.mockResolvedValue(err(new DatabaseError('DB connection failed')));

    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });

    expect(result.isErr()).toBe(true);
  });

  it('propagates credits grant error', async () => {
    userRepo.findByEmail.mockResolvedValue(err(new ValidationError('Not found')));
    userRepo.create.mockResolvedValue(ok(makeValidUser()));
    creditsRepo.addCredits.mockResolvedValue(err(new DatabaseError('Credits grant failed')));

    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });

    expect(result.isErr()).toBe(true);
  });

  it('returns UserDTO with correct fields on success', async () => {
    const user = makeValidUser();
    userRepo.findByEmail.mockResolvedValue(err(new ValidationError('Not found')));
    userRepo.create.mockResolvedValue(ok(user));
    creditsRepo.addCredits.mockResolvedValue(ok({ balance: 20 }));

    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const dto = result.unwrap();
      expect(dto.id).toBe(user.id);
      expect(dto.email).toBe(user.email);
      expect(dto.name).toBe(user.name);
      expect(dto.creditBalance).toBe(20);
    }
  });
});
