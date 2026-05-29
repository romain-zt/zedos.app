import { IUserRepository } from '@domain/user/user-repository';
import { UserDomainService } from '@domain/user/user-service';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, ErrorCode, UnauthorizedError } from '@shared/errors/application-error';
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
      const emailValidation = UserDomainService.validateEmail(input.email);
      if (emailValidation.isErr()) {
        return err<UserDTO, ApplicationError>(emailValidation.error);
      }
      const email = emailValidation.unwrap();

      const userResult = await this.userRepository.findByEmail(email);
      if (userResult.isErr()) {
        logger.warn('Sign in failed: user not found', { email: email.value });
        return err<UserDTO, ApplicationError>(new UnauthorizedError('Invalid credentials'));
      }
      const user = userResult.unwrap();

      const passwordVerification = await UserDomainService.verifyPassword(
        input.password,
        user.passwordHash
      );
      if (passwordVerification.isErr() || !passwordVerification.unwrap()) {
        logger.warn('Sign in failed: invalid password', { userId: user.id });
        return err<UserDTO, ApplicationError>(new UnauthorizedError('Invalid credentials'));
      }

      logger.info('User signed in successfully', { userId: user.id });

      const dto: UserDTO = {
        id: user.id,
        email: user.email,
        name: user.name,
        creditBalance: user.creditBalance,
      };
      return ok<UserDTO, ApplicationError>(dto);
    } catch (error: unknown) {
      logger.error('SignIn unexpected error', error instanceof Error ? error : { error });
      return err<UserDTO, ApplicationError>(
        new ApplicationError({
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Unexpected error',
          statusCode: 500,
        })
      );
    }
  }
}
