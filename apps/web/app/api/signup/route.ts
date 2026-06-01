/**
 * Sign Up API Route
 *
 * Thin HTTP adapter layer.
 * Validates input → calls use-case → returns DTO.
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { SignUpRequestSchema } from '@contracts/auth/auth-contracts';
import { SignUpUseCase } from '@application/auth/sign-up-usecase';
import { DrizzleUserRepository } from '@infrastructure/persistence/user-repository';
import { DrizzleCreditsRepository } from '@infrastructure/persistence/credits-repository';
import { applicationErrorJson, catchUnknownError } from '@shared/http';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';

const logger = createLogger({ operation: 'signup' });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = SignUpRequestSchema.safeParse(body);

    if (!parseResult.success) {
      logger.warn('Signup validation failed', validationFailureData(parseResult.error.flatten()));
      const errors = parseResult.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const userRepository = new DrizzleUserRepository();
    const creditsRepository = new DrizzleCreditsRepository();
    const useCase = new SignUpUseCase(userRepository, creditsRepository);
    const { email, password, name } = parseResult.data;
    const result = await useCase.execute({ email, password, name });

    if (result.isErr()) {
      logger.warn('Signup failed', { statusCode: result.error.statusCode });
      return NextResponse.json(applicationErrorJson(result.error), {
        status: result.error.statusCode,
      });
    }

    const userDTO = result.unwrap();
    logger.info('Signup succeeded', { userId: userDTO.id });
    return NextResponse.json(
      { user: userDTO, message: 'Sign up successful' },
      { status: 201 }
    );
  } catch (error: unknown) {
    return catchUnknownError(error, 'Internal server error');
  }
}
