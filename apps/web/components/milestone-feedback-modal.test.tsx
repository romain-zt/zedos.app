/** @vitest-environment happy-dom */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MilestoneFeedbackModal } from './milestone-feedback-modal';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MilestoneFeedbackModal', () => {
  it('does not persist feedback when user skips', () => {
    const onClose = vi.fn();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MilestoneFeedbackModal
        open
        onClose={onClose}
        projectId="project-1"
        prdVersionId="prd-1"
        milestoneType="prd_created"
        title="Feedback"
        description="Help us improve"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
