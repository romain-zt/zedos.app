import { IUserRepository } from '@domain/user/user-repository';
import { UserDomainService } from '@domain/user/user-service';
import { ICreditsRepository } from '@domain/credits/credits-repository';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, ValidationError } from '@shared/errors/application-error';
import { UserDTO } from '@contracts/auth/auth-contracts';
import { createLogger } from '@shared/observability/logger';
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
      // 1. Validate email
      const emailValidation = UserDomainService.validateEmail(input.email);
      if (emailValidation.isErr()) {
        return emailValidation as any;
      }
      const email = emailValidation.unwrap();

      // 2. Check if user already exists
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser.isOk()) {
        const validationErr = new ValidationError('User with this email already exists');
        logger.warn('Sign up failed: user already exists', { email: email.value });
        return err(validationErr);
      }

      // 3. Hash password
      const hashResult = await UserDomainService.hashPassword(input.password);
      if (hashResult.isErr()) {
        return hashResult as any;
      }
      const passwordHash = hashResult.unwrap();

      // 4. Create user entity
      const userId = uuidv4();
      const user = UserDomainService.createUser(userId, email, input.name, passwordHash);

      // 5. Persist user
      const createResult = await this.userRepository.create(user);
      if (createResult.isErr()) {
        logger.error('Sign up failed: user creation error', createResult.error);
        return createResult as any;
      }
      const createdUser = createResult.unwrap();

      // 6. Grant starter credits
      const STARTER_CREDITS = parseInt(process.env.STARTER_CREDITS || '20');
      const creditsResult = await this.creditsRepository.addCredits(
        userId,
        STARTER_CREDITS,
        'grant'
      );
      if (creditsResult.isErr()) {
        logger.error('Sign up failed: starter credits grant error', creditsResult.error);
        return creditsResult as any;
      }

      logger.info('User signed up successfully', { userId, email: email.value });

      // 7. Return DTO
      const dto: UserDTO = {
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        creditBalance: STARTER_CREDITS,
      };
      return ok(dto) as any;
    } catch (error: any) {
      logger.error('SignUp unexpected error', error);
      return err(new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR' as any,
        message: 'Unexpected error',
        statusCode: 500,
      }));
    }
  }
}
