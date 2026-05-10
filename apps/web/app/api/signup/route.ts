/**
 * Sign Up API Route
 *
 * Thin HTTP adapter layer.
 * Validates input → calls use-case → returns DTO.
 * No business logic; all logic in application layer.
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { SignUpRequestSchema } from '@repo/contracts/auth/auth-contracts';
import { SignUpUseCase } from '@application/auth/sign-up-usecase';
import { PrismaUserRepository } from '@infrastructure/persistence/user-repository';
import { PrismaCreditsRepository } from '@infrastructure/persistence/credits-repository';
import { prisma } from '@/lib/prisma';
import { ApplicationError } from '@shared/errors/application-error';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse & validate request body
    const body = await request.json();
    const parseResult = SignUpRequestSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = parseResult.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const input = parseResult.data as any;

    // 2. Instantiate repositories
    const userRepository = new PrismaUserRepository(prisma);
    const creditsRepository = new PrismaCreditsRepository(prisma);

    // 3. Execute use-case
    const useCase = new SignUpUseCase(userRepository, creditsRepository);
    const result = await useCase.execute(input);

    // 4. Map result to HTTP response
    if (result.isErr()) {
      const error = result.error as ApplicationError;
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.statusCode }
      );
    }

    const userDTO = result.unwrap();
    return NextResponse.json(
      { user: userDTO, message: 'Sign up successful' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Sign up error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
