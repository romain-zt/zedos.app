import { describe, it, expect, vi } from 'vitest';
import {
  sendAccountDeletionNotice,
  sendEmailChangeNotice,
  sendPasswordChangeNotice,
  sendPersonalDataExportReady,
} from './sender';

const sendEmailMock = vi.hoisted(() => vi.fn(async () => ({ sent: true })));

vi.mock('./client', () => ({
  sendEmail: sendEmailMock,
}));

describe('mail sender', () => {
  it('builds email change payload', async () => {
    await sendEmailChangeNotice({ to: 'alice@example.com', newEmail: 'new@example.com' });
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'alice@example.com',
      }),
    );
  });

  it('builds password change payload', async () => {
    await sendPasswordChangeNotice({ to: 'alice@example.com' });
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'alice@example.com',
      }),
    );
  });

  it('builds account deletion payload', async () => {
    await sendAccountDeletionNotice({ to: 'alice@example.com' });
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'alice@example.com',
      }),
    );
  });

  it('builds export-ready payload', async () => {
    await sendPersonalDataExportReady({ to: 'alice@example.com' });
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'alice@example.com',
      }),
    );
  });
});
