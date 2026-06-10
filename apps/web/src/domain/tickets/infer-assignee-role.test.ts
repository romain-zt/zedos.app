import { describe, it, expect } from 'vitest';
import { inferAssigneeRole } from './infer-assignee-role';

describe('inferAssigneeRole', () => {
  it('routes UI work to the frontend developer', () => {
    expect(inferAssigneeRole('Build the settings page UI')).toBe('frontend_dev');
    expect(inferAssigneeRole('Add responsive layout for mobile')).toBe('frontend_dev');
  });

  it('routes service work to the backend developer', () => {
    expect(inferAssigneeRole('Create the webhook endpoint')).toBe('backend_dev');
    expect(inferAssigneeRole('Add database migration for users')).toBe('backend_dev');
  });

  it('returns null when ambiguous or unknown', () => {
    expect(inferAssigneeRole('Write the launch announcement')).toBeNull();
    expect(inferAssigneeRole('Build form API', 'component endpoint')).toBeNull();
  });

  it('uses the description as additional signal', () => {
    expect(inferAssigneeRole('Implement feature', 'expose a new API route with auth')).toBe(
      'backend_dev',
    );
  });
});
