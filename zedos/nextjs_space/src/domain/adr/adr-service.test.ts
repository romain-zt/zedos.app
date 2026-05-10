import { describe, it, expect } from 'vitest';
import { AdrDomainService } from './adr-service';

describe('AdrDomainService.calculateReadinessScore', () => {
  it('returns 0 for no filled sections and no ADRs', () => {
    const s = AdrDomainService.calculateReadinessScore(0, 8, 0);
    expect(s.productClarity.points).toBe(0);
    expect(s.architectureBoundaries.points).toBe(0);
    expect(s.total.points).toBe(0);
    expect(s.total.percentage).toBe(0);
  });

  it('returns full product clarity for all sections', () => {
    const s = AdrDomainService.calculateReadinessScore(8, 8, 0);
    expect(s.productClarity.points).toBe(10);
    expect(s.productClarity.percentage).toBe(100);
  });

  it('returns full arch boundaries for all core ADRs complete', () => {
    const s = AdrDomainService.calculateReadinessScore(0, 8, 8);
    expect(s.architectureBoundaries.points).toBe(15);
    expect(s.architectureBoundaries.percentage).toBe(100);
  });

  it('returns 100% total when both maxed', () => {
    const s = AdrDomainService.calculateReadinessScore(8, 8, 8);
    expect(s.total.points).toBe(25);
    expect(s.total.percentage).toBe(100);
  });

  it('handles partial scores', () => {
    const s = AdrDomainService.calculateReadinessScore(4, 8, 4);
    expect(s.productClarity.points).toBe(5);
    expect(s.architectureBoundaries.points).toBe(8); // round(4/8*15) = 8
    expect(s.total.points).toBe(13);
  });
});
