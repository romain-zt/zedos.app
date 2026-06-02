'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { localePath, normalizePathWithoutLocale } from '@/lib/locale-path';
import { useI18n } from '@/src/i18n';
import { FeatureSplitListResponseSchema } from '@repo/contracts/feature-split/feature-split';

type ClusterNavItem = {
  id: string;
  label: string;
  hasCorpus: boolean;
};

export function ProjectStoryClusterNav({ projectId }: { projectId: string }) {
  const { locale } = useI18n();
  const pathname = usePathname();
  const pathWithoutLocale = normalizePathWithoutLocale(pathname);
  const router = useRouter();
  const [clusters, setClusters] = useState<ClusterNavItem[]>([]);

  const loadClusters = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/feature-split`);
      if (!res.ok) {
        setClusters([]);
        return;
      }
      const raw = await res.json();
      const parsed = FeatureSplitListResponseSchema.safeParse(raw);
      if (!parsed.success) {
        setClusters([]);
        return;
      }

      const confirmedClusters = parsed.data
        .filter((split) => split.status === 'confirmed')
        .flatMap((split) => split.clusters)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      if (confirmedClusters.length === 0) {
        setClusters([]);
        return;
      }

      const corpusFlags = await Promise.all(
        confirmedClusters.map(async (cluster) => {
          try {
            const corpusRes = await fetch(
              `/api/projects/${projectId}/user-stories?featureSplitClusterId=${encodeURIComponent(cluster.id)}`
            );
            return corpusRes.ok;
          } catch {
            return false;
          }
        })
      );

      setClusters(
        confirmedClusters.map((cluster, index) => ({
          id: cluster.id,
          label: cluster.label,
          hasCorpus: corpusFlags[index] ?? false,
        }))
      );
    } catch {
      setClusters([]);
    }
  }, [projectId]);

  useEffect(() => {
    void loadClusters();
  }, [loadClusters, pathname]);

  if (clusters.length === 0) return null;

  return (
    <div className="space-y-0.5 pl-3 border-l border-border/60 ml-3">
      {clusters.map((cluster) => {
        const href = `/dashboard/projects/${projectId}/user-stories/${cluster.id}`;
        const isActive = pathWithoutLocale === href;
        return (
          <button
            key={cluster.id}
            type="button"
            onClick={() => router.push(localePath(href, locale))}
            className={cn(
              'w-full text-left rounded-md px-2 py-2 text-xs font-medium transition-colors min-h-[44px] flex items-center gap-2',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
            title={cluster.label}
          >
            <span className="truncate flex-1">{cluster.label}</span>
            {cluster.hasCorpus ? (
              <span className="shrink-0 text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                saved
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
