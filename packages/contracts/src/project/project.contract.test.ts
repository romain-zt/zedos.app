import { describe, it, expect } from 'vitest';
import {
  CreateProjectRequestSchema,
  UpdateProjectJourneyModeRequestSchema,
  ProjectDTOSchema,
  JourneyModeSchema,
} from './project-contracts';

describe('JourneyModeSchema', () => {
  it('accepts standard and express', () => {
    expect(JourneyModeSchema.safeParse('standard').success).toBe(true);
    expect(JourneyModeSchema.safeParse('express').success).toBe(true);
  });

  it('rejects unknown values', () => {
    expect(JourneyModeSchema.safeParse('turbo').success).toBe(false);
  });
});

describe('CreateProjectRequestSchema', () => {
  it('defaults journeyMode to standard', () => {
    const r = CreateProjectRequestSchema.safeParse({ name: 'Alpha' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.journeyMode).toBe('standard');
  });

  it('accepts express journeyMode', () => {
    const r = CreateProjectRequestSchema.safeParse({ name: 'Beta', journeyMode: 'express' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.journeyMode).toBe('express');
  });
});

describe('UpdateProjectJourneyModeRequestSchema', () => {
  it('requires journeyMode', () => {
    expect(UpdateProjectJourneyModeRequestSchema.safeParse({}).success).toBe(false);
    const r = UpdateProjectJourneyModeRequestSchema.safeParse({ journeyMode: 'express' });
    expect(r.success).toBe(true);
  });
});

describe('ProjectDTOSchema', () => {
  it('includes journeyMode', () => {
    const now = new Date();
    const r = ProjectDTOSchema.safeParse({
      id: 'p1',
      userId: 'u1',
      name: 'Test',
      description: null,
      phase: 'intake',
      journeyMode: 'standard',
      architectureStartedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    expect(r.success).toBe(true);
  });

  it('accepts an optional templateSlug', () => {
    const now = new Date();
    const r = ProjectDTOSchema.safeParse({
      id: 'p1',
      userId: 'u1',
      name: 'Test',
      description: null,
      phase: 'intake',
      journeyMode: 'express',
      architectureStartedAt: null,
      createdAt: now,
      updatedAt: now,
      templateSlug: 'pitch-tomorrow',
    });
    expect(r.success).toBe(true);
  });

  it('rejects an unknown templateSlug', () => {
    const now = new Date();
    const r = ProjectDTOSchema.safeParse({
      id: 'p1',
      userId: 'u1',
      name: 'Test',
      description: null,
      phase: 'intake',
      journeyMode: 'standard',
      architectureStartedAt: null,
      createdAt: now,
      updatedAt: now,
      templateSlug: 'not-a-template',
    });
    expect(r.success).toBe(false);
  });
});

describe('CreateProjectRequestSchema — templateSlug', () => {
  it('accepts a valid templateSlug', () => {
    const r = CreateProjectRequestSchema.safeParse({
      name: 'Pitch',
      templateSlug: 'fr-pitch-demain',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.templateSlug).toBe('fr-pitch-demain');
  });

  it('rejects an unknown templateSlug', () => {
    const r = CreateProjectRequestSchema.safeParse({
      name: 'Pitch',
      templateSlug: 'mystery-template',
    });
    expect(r.success).toBe(false);
  });

  it('omits templateSlug when not provided', () => {
    const r = CreateProjectRequestSchema.safeParse({ name: 'Plain' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.templateSlug).toBeUndefined();
  });
});
