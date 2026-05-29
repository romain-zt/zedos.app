import { IUserRepository } from '@domain/user/user-repository';
import { UserDomainService } from '@domain/user/user-service';
import { ICreditsRepository } from '@domain/credits/credits-repository';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, ErrorCode, ValidationError } from '@shared/errors/application-error';
import { UserDTO } from '@repo/contracts/auth/auth-contracts';
import { createLogger } from '@shared/observability/logger';
import { forwardErr } from '@shared/result/propagate';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger({ operation: 'SignUpUseCase' });

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
}

export class SignUpUseCase {
  constructor(
    private userRepository: IUserRepository,
    private creditsRepository: ICreditsRepository
  ) {}

  async execute(input: SignUpInput): Promise<Result<UserDTO, ApplicationError>> {
    try {
      const emailValidation = UserDomainService.validateEmail(input.email);
      if (emailValidation.isErr()) {
        return err<UserDTO, ApplicationError>(emailValidation.error);
      }
      const email = emailValidation.unwrap();

      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser.isOk()) {
        logger.warn('Sign up failed: user already exists', { email: email.value });
        return err<UserDTO, ApplicationError>(
          new ValidationError('User with this email already exists')
        );
      }

      const hashResult = await UserDomainService.hashPassword(input.password);
      if (hashResult.isErr()) {
        return err<UserDTO, ApplicationError>(hashResult.error);
      }
      const passwordHash = hashResult.unwrap();

      const userId = uuidv4();
      const user = UserDomainService.createUser(userId, email, input.name, passwordHash);

      const createResult = await this.userRepository.create(user);
      if (createResult.isErr()) {
        logger.error('Sign up failed: user creation error', createResult.error);
        return forwardErr(createResult);
      }
      const createdUser = createResult.unwrap();

      const STARTER_CREDITS = parseInt(process.env.STARTER_CREDITS || '20', 10);
      const creditsResult = await this.creditsRepository.addCredits(
        userId,
        STARTER_CREDITS,
        'grant',
        {
          correlationId: `starter-grant:${userId}`,
          metadata: { reason: 'New account starter credits' },
        }
      );
      if (creditsResult.isErr()) {
        logger.error('Sign up failed: starter credits grant error', creditsResult.error);
        return forwardErr(creditsResult);
      }
      const creditedBalance = creditsResult.unwrap().amount;

      logger.info('User signed up successfully', { userId, email: email.value });

      const dto: UserDTO = {
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        creditBalance: creditedBalance,
      };
      return ok<UserDTO, ApplicationError>(dto);
    } catch (error: unknown) {
      logger.error('SignUp unexpected error', error instanceof Error ? error : { error });
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
