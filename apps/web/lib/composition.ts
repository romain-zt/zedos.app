/**
 * App composition root — singleton adapters + credit use cases (lazy init).
 */

import { AddCreditsUseCase } from '@application/credits/add-credits-usecase';
import { CheckCreditsUseCase } from '@application/credits/check-credits-usecase';
import { DeductCreditsUseCase } from '@application/credits/deduct-credits-usecase';
import { ReverseCreditsUseCase } from '@application/credits/reverse-credits-usecase';
import { DrizzleCreditsRepository } from '@infrastructure/persistence/credits-repository';

export type CreditsComposition = {
  repo: DrizzleCreditsRepository;
  checkCredits: CheckCreditsUseCase;
  deductCredits: DeductCreditsUseCase;
  addCredits: AddCreditsUseCase;
  reverseCredits: ReverseCreditsUseCase;
};

let creditsSingleton: CreditsComposition | null = null;

export function getCreditsComposition(): CreditsComposition {
  if (!creditsSingleton) {
    const repo = new DrizzleCreditsRepository();
    creditsSingleton = {
      repo,
      checkCredits: new CheckCreditsUseCase(repo),
      deductCredits: new DeductCreditsUseCase(repo),
      addCredits: new AddCreditsUseCase(repo),
      reverseCredits: new ReverseCreditsUseCase(repo),
    };
  }
  return creditsSingleton;
}
