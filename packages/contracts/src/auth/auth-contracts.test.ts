import { describe, it, expect } from 'vitest';
import {
  SignUpRequestSchema,
  SignInRequestSchema,
  UserDTOSchema,
  AuthResponseSchema,
  ErrorResponseSchema,
} from './auth-contracts';

describe('SignUpRequestSchema', () => {
  it('validates a correct sign-up request', () => {
    const data = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };
    const result = SignUpRequestSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects invalid email format', () => {
    const data = {
      email: 'not-an-email',
      password: 'password123',
      name: 'Test User',
    };
    const result = SignUpRequestSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 characters', () => {
    const data = {
      email: 'test@example.com',
      password: 'short',
      name: 'Test User',
    };
    const result = SignUpRequestSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const data = {
      email: 'test@example.com',
      password: 'password123',
      name: '',
    };
    const result = SignUpRequestSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects missing fields', () => {
    const data = { email: 'test@example.com' };
    const result = SignUpRequestSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('SignInRequestSchema', () => {
  it('validates a correct sign-in request', () => {
    const data = {
      email: 'test@example.com',
      password: 'anypassword',
    };
    const result = SignInRequestSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects invalid email format', () => {
    const data = {
      email: 'not-an-email',
      password: 'password123',
    };
    const result = SignInRequestSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const data = {
      email: 'test@example.com',
      password: '',
    };
    const result = SignInRequestSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects missing email', () => {
    const data = { password: 'password123' };
    const result = SignInRequestSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('UserDTOSchema', () => {
  it('validates a correct user DTO', () => {
    const data = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      creditBalance: 50,
    };
    const result = UserDTOSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('allows null name', () => {
    const data = {
      id: 'user-123',
      email: 'test@example.com',
      name: null,
      creditBalance: 0,
    };
    const result = UserDTOSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const data = {
      id: 'user-123',
      email: 'test@example.com',
    };
    const result = UserDTOSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('AuthResponseSchema', () => {
  it('validates a successful auth response', () => {
    const data = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        creditBalance: 50,
      },
      message: 'Authentication successful',
    };
    const result = AuthResponseSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects response without message', () => {
    const data = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        creditBalance: 50,
      },
    };
    const result = AuthResponseSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('ErrorResponseSchema', () => {
  it('validates an error response with error only', () => {
    const data = {
      error: 'Something went wrong',
    };
    const result = ErrorResponseSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('validates an error response with details', () => {
    const data = {
      error: 'Validation failed',
      details: { email: ['Invalid email format'] },
    };
    const result = ErrorResponseSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects missing error field', () => {
    const data = {
      details: { email: ['Invalid email format'] },
    };
    const result = ErrorResponseSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
