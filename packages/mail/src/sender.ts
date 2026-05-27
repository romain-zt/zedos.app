import { sendEmail } from './client';
import {
  accountDeletedTemplate,
  emailChangedTemplate,
  passwordChangedTemplate,
  passwordResetTemplate,
  personalDataExportReadyTemplate,
} from './templates';

export async function sendEmailChangeNotice(input: {
  to: string;
  newEmail: string;
}): Promise<void> {
  const template = emailChangedTemplate(input.newEmail);
  await sendEmail({
    to: input.to,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendPasswordChangeNotice(input: {
  to: string;
}): Promise<void> {
  const template = passwordChangedTemplate();
  await sendEmail({
    to: input.to,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendAccountDeletionNotice(input: {
  to: string;
}): Promise<void> {
  const template = accountDeletedTemplate();
  await sendEmail({
    to: input.to,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendPersonalDataExportReady(input: {
  to: string;
}): Promise<void> {
  const template = personalDataExportReadyTemplate();
  await sendEmail({
    to: input.to,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendPasswordResetLink(input: {
  to: string;
  resetUrl: string;
}): Promise<void> {
  const template = passwordResetTemplate(input.resetUrl);
  await sendEmail({
    to: input.to,
    subject: template.subject,
    html: template.html,
  });
}
