import type {
  WaitlistContactRequest,
  WaitlistContactResponse,
  WaitlistQualificationRequest,
} from '@repo/contracts/marketing/waitlist';
import {
  db,
  eq,
  waitlistLeads,
  type WaitlistLeadInsert,
  type WaitlistLeadUpdate,
} from '@repo/db';
import { err, ok, type Result } from '@repo/result';
import type { WaitlistRepository } from '@application/waitlist/manage-waitlist-usecase';
import {
  type ApplicationError,
  DatabaseError,
} from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'WaitlistRepository' });

export class DrizzleWaitlistRepository implements WaitlistRepository {
  async upsertContact(
    input: WaitlistContactRequest
  ): Promise<Result<WaitlistContactResponse, ApplicationError>> {
    try {
      const [existing] = await db
        .select({ id: waitlistLeads.id })
        .from(waitlistLeads)
        .where(eq(waitlistLeads.email, input.email))
        .limit(1);

      const contactValues: WaitlistLeadInsert = {
        email: input.email,
        name: input.name,
        businessName: input.businessName,
        businessType: input.businessType,
        website: input.website ?? null,
        consentToContact: input.consentToContact,
      };
      const contactUpdate: WaitlistLeadUpdate = {
        name: input.name,
        businessName: input.businessName,
        businessType: input.businessType,
        website: input.website ?? null,
        consentToContact: input.consentToContact,
        updatedAt: new Date(),
      };

      const [lead] = await db
        .insert(waitlistLeads)
        .values(contactValues)
        .onConflictDoUpdate({
          target: waitlistLeads.email,
          set: contactUpdate,
        })
        .returning({ id: waitlistLeads.id });

      if (!lead) return err(new DatabaseError('Waitlist contact was not saved'));

      return ok({
        leadId: lead.id,
        status: existing ? 'updated' : 'created',
      });
    } catch (error) {
      logger.error('Failed to save waitlist contact', error);
      return err(new DatabaseError('Failed to save waitlist contact'));
    }
  }

  async qualifyLead(
    input: WaitlistQualificationRequest
  ): Promise<Result<string | null, ApplicationError>> {
    try {
      const qualificationUpdate: WaitlistLeadUpdate = {
        practitionerRange: input.practitionerRange ?? null,
        locationRange: input.locationRange ?? null,
        bookingPlatform: input.bookingPlatform ?? null,
        mainChallenge: input.mainChallenge ?? null,
        launchTimeframe: input.launchTimeframe ?? null,
        desiredChange: input.desiredChange ?? null,
        status: 'qualified',
        qualifiedAt: new Date(),
        updatedAt: new Date(),
      };

      const [lead] = await db
        .update(waitlistLeads)
        .set(qualificationUpdate)
        .where(eq(waitlistLeads.id, input.leadId))
        .returning({ id: waitlistLeads.id });

      return ok(lead?.id ?? null);
    } catch (error) {
      logger.withContext({ leadId: input.leadId }).error(
        'Failed to qualify waitlist contact',
        error
      );
      return err(new DatabaseError('Failed to qualify waitlist contact'));
    }
  }
}
