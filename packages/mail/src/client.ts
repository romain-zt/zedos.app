import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const defaultFrom = process.env.MAIL_FROM ?? 'Zedos <noreply@zedos.app>';

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!resendApiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(resendApiKey);
  }
  return resendClient;
}

export function getMailConfig(): { from: string; enabled: boolean } {
  return {
    from: defaultFrom,
    enabled: Boolean(getResendClient()),
  };
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean }> {
  const client = getResendClient();
  if (!client) {
    console.warn('[mail] RESEND_API_KEY absent, email non envoye', {
      to: input.to,
      subject: input.subject,
    });
    return { sent: false };
  }

  await client.emails.send({
    from: defaultFrom,
    to: [input.to],
    subject: input.subject,
    html: input.html,
  });

  return { sent: true };
}
