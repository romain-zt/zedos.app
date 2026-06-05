import type {
  RedTeamReportSummary,
  RedTeamReportDetail,
} from '@repo/contracts/ai';
import type {
  RedTeamReport,
  RedTeamReportWithFindings,
} from '@/src/domain/red-team/red-team-report';

export function toRedTeamReportSummary(r: RedTeamReport): RedTeamReportSummary {
  return {
    id: r.id,
    projectId: r.projectId,
    prdVersionId: r.prdVersionId,
    status: r.status,
    creditCost: r.creditCost,
    findingCount: r.findingCount,
    errorMessage: r.errorMessage,
    createdAt: r.createdAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
  };
}

export function toRedTeamReportDetail(r: RedTeamReportWithFindings): RedTeamReportDetail {
  return {
    ...toRedTeamReportSummary(r),
    findings: r.findings.map((f) => ({
      id: f.id,
      sortOrder: f.sortOrder,
      category: f.category,
      severity: f.severity,
      sectionId: f.sectionId,
      title: f.title,
      evidence: f.evidence,
      suggestion: f.suggestion,
    })),
  };
}
