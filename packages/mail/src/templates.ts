export interface EmailTemplate {
  subject: string;
  html: string;
}

function shell(title: string, body: string): string {
  return `
  <div style="font-family:Inter,Arial,sans-serif;line-height:1.5;color:#111827;max-width:640px;margin:0 auto;padding:24px;">
    <h1 style="font-size:20px;margin:0 0 12px;">${title}</h1>
    <div style="font-size:14px;">${body}</div>
    <p style="margin-top:24px;font-size:12px;color:#6b7280;">
      Zedos
    </p>
  </div>`;
}

export function emailChangedTemplate(nextEmail: string): EmailTemplate {
  return {
    subject: 'Your email has been changed',
    html: shell(
      'Email change confirmed',
      `<p>Your new email is now <strong>${nextEmail}</strong>.</p><p>If this was not you, secure your account immediately.</p>`,
    ),
  };
}

export function passwordChangedTemplate(): EmailTemplate {
  return {
    subject: 'Your password has been changed',
    html: shell(
      'Password updated',
      '<p>Your Zedos account password was just changed.</p><p>If this was not you, contact support immediately.</p>',
    ),
  };
}

export function accountDeletedTemplate(): EmailTemplate {
  return {
    subject: 'Your Zedos account has been deleted',
    html: shell(
      'Account deletion',
      '<p>Your account and related data were deleted according to your request.</p>',
    ),
  };
}

export function personalDataExportReadyTemplate(): EmailTemplate {
  return {
    subject: 'Your personal data export is ready',
    html: shell(
      'Privacy export ready',
      '<p>Your personal data export is now available from your Settings page.</p>',
    ),
  };
}

export function passwordResetTemplate(resetUrl: string): EmailTemplate {
  return {
    subject: 'Reset your password',
    html: shell(
      'Reset your password',
      `<p>You requested a password reset.</p><p><a href="${resetUrl}" style="display:inline-block;background:#111827;color:#ffffff;padding:10px 14px;border-radius:8px;text-decoration:none;">Reset my password</a></p><p>If this was not you, ignore this email.</p>`,
    ),
  };
}
