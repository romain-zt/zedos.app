'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TemplateSummaryDTO } from '@repo/contracts/templates';
import { ArrowRight, Eye } from 'lucide-react';
import { useI18n } from '@/src/i18n';

interface TemplateCardProps {
  template: TemplateSummaryDTO;
  onPreview: (slug: TemplateSummaryDTO['slug']) => void;
}

export function TemplateCard({ template, onPreview }: TemplateCardProps) {
  const router = useRouter();
  const { tp } = useI18n();

  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="capitalize">
            {template.journeyHint}
          </Badge>
          <Badge variant="secondary" className="capitalize">
            {template.category.replace(/-/g, ' ')}
          </Badge>
          <Badge variant="outline">{template.sector}</Badge>
        </div>
        <div className="space-y-1.5">
          <h3 className="font-display text-base font-semibold leading-tight">
            {template.title}
          </h3>
          <p className="text-sm text-muted-foreground">{template.description}</p>
        </div>
        <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="w-full min-h-11 sm:w-auto"
            onClick={() => onPreview(template.slug)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {tp('card.preview', 'Preview')}
          </Button>
          <Button
            type="button"
            className="w-full min-h-11 sm:w-auto"
            onClick={() =>
              router.push(`/dashboard/projects?template=${encodeURIComponent(template.slug)}`)
            }
          >
            {tp('card.use', 'Use template')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
