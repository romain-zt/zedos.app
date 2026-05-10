/**
 * ADR Domain Service
 *
 * Pure domain logic for readiness scoring.
 */

import { CORE_ADR_COUNT } from './adr';

export interface ReadinessCategory {
  points: number;
  weight: number;
  percentage: number;
}

export interface ReadinessScore {
  productClarity: ReadinessCategory;
  architectureBoundaries: ReadinessCategory;
  total: ReadinessCategory;
}

export class AdrDomainService {
  /**
   * Calculate the Production Readiness Score.
   *
   * Product Clarity: 10 points max, based on filled PRD sections / 8.
   * Architecture Boundaries: 15 points max, based on complete core ADRs / 8.
   */
  static calculateReadinessScore(
    filledPrdSections: number,
    totalPrdSections: number,
    completeAdrs: number
  ): ReadinessScore {
    const productClarityPoints = Math.round((filledPrdSections / totalPrdSections) * 10);
    const archBoundaryPoints = Math.round((completeAdrs / CORE_ADR_COUNT) * 15);
    const totalPoints = productClarityPoints + archBoundaryPoints;
    const totalWeight = 25; // stub: only 2 categories out of eventual 100

    return {
      productClarity: {
        points: productClarityPoints,
        weight: 10,
        percentage: Math.round((productClarityPoints / 10) * 100),
      },
      architectureBoundaries: {
        points: archBoundaryPoints,
        weight: 15,
        percentage: Math.round((archBoundaryPoints / 15) * 100),
      },
      total: {
        points: totalPoints,
        weight: totalWeight,
        percentage: Math.round((totalPoints / totalWeight) * 100),
      },
    };
  }
}
