import { IUserRepository } from '@domain/user/user-repository';
import { UserDomainService } from '@domain/user/user-service';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, UnauthorizedError } from '@shared/errors/application-error';
import { UserDTO } from '@repo/contracts/auth/auth-contracts';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'SignInUseCase' });

export interface SignInInput {
  email: string;
  password: string;
}

export class SignInUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: SignInInput): Promise<Result<UserDTO, ApplicationError>> {
    try {
      // 1. Validate email
      const emailValidation = UserDomainService.validateEmail(input.email);
      if (emailValidation.isErr()) {
        return emailValidation as any;
      }
      const email = emailValidation.unwrap();

      // 2. Find user by email
      const userResult = await this.userRepository.findByEmail(email);
      if (userResult.isErr()) {
        const unauthorizedErr = new UnauthorizedError('Invalid credentials');
        logger.warn('Sign in failed: user not found', { email: email.value });
        return err(unauthorizedErr);
      }
      const user = userResult.unwrap();

      // 3. Verify password
      const passwordVerification = await UserDomainService.verifyPassword(
        input.password,
        user.passwordHash
      );
      if (passwordVerification.isErr() || !passwordVerification.unwrap()) {
        const unauthorizedErr = new UnauthorizedError('Invalid credentials');
        logger.warn('Sign in failed: invalid password', { userId: user.id });
        return err(unauthorizedErr);
      }

      logger.info('User signed in successfully', { userId: user.id });

      // 4. Return DTO
      const dto: UserDTO = {
        id: user.id,
        email: user.email,
        name: user.name,
        creditBalance: user.creditBalance,
      };
      return ok(dto) as any;
    } catch (error: any) {
      logger.error('SignIn unexpected error', error);
      return err(new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR' as any,
        message: 'Unexpected error',
        statusCode: 500,
      }));
    }
  }
}
