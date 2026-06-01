'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { WorkspaceScoreResponseSchema } from '@repo/contracts/project/workspace-score';
import { useI18n } from '@/src/i18n';

interface WorkspaceScorePanelProps {
  projectId: string;
}

export function WorkspaceScorePanel({ projectId }: WorkspaceScorePanelProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [clarificationScore, setClarificationScore] = useState(0);
  const [architectureScore, setArchitectureScore] = useState(0);
  const [sectionsCovered, setSectionsCovered] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/workspace-score`);
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const raw: unknown = await res.json();
        const parsed = WorkspaceScoreResponseSchema.safeParse(raw);
        if (!parsed.success) {
          setLoading(false);
          return;
        }
        setClarificationScore(parsed.data.clarification.score);
        setSectionsCovered(parsed.data.clarification.coveredSections.length);
        setArchitectureScore(parsed.data.architecture.total.percentage);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [projectId]);

  if (loading) {
    return <Badge variant="outline">…</Badge>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary" className="gap-1">
        <span>{t('score.clarification')}</span>
        <span>{clarificationScore}%</span>
        <span className="font-normal opacity-80">· {sectionsCovered}/8</span>
      </Badge>
      <Badge variant="secondary" className="gap-1">
        <span>{t('score.architecture')}</span>
        <span>{architectureScore}%</span>
      </Badge>
    </div>
  );
}
