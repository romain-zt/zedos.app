'use client';

import { useEffect, useState } from 'react';
import {
  AnonymousSharedPrdResponseSchema,
  type AnonymousSharedPrdResponse,
} from '@repo/contracts/share/anonymous-read';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, FileText, AlertCircle, CheckCircle2, CircleDot, Loader2 } from 'lucide-react';
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate';

function asContentRecord(content: unknown): Record<string, unknown> | null {
  if (content === null || content === undefined) return null;
  if (typeof content === 'object' && !Array.isArray(content)) {
    return content as Record<string, unknown>;
  }
  return null;
}

function getSections(content: Record<string, unknown> | null): unknown[] {
  if (!content) return [];
  const raw = content.sections;
  return Array.isArray(raw) ? raw : [];
}

export function SharedPrdView({ token }: { token: string }) {
  const [data, setData] = useState<AnonymousSharedPrdResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedPrd = async () => {
      try {
        const res = await fetch(`/api/share/${token}`);
        if (!res?.ok) {
          const errData = await res?.json?.().catch(() => null);
          const msg =
            errData && typeof errData === 'object' && errData !== null && 'error' in errData
              ? String((errData as { error: unknown }).error)
              : 'Share link not found or disabled';
          setError(msg);
          return;
        }
        const prdJson: unknown = await res.json();
        const parsed = AnonymousSharedPrdResponseSchema.safeParse(prdJson);
        if (!parsed.success) {
          setError('Failed to load shared PRD');
          return;
        }
        setData(parsed.data);
      } catch {
        setError('Failed to load shared PRD');
      } finally {
        setLoading(false);
      }
    };
    fetchSharedPrd();
  }, [token]);

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-amber-600 bg-amber-50';
      case 'low':
        return 'text-red-500 bg-red-50';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case 'medium':
        return <CircleDot className="h-3.5 w-3.5" />;
      case 'low':
        return <AlertCircle className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading PRD...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="font-display text-lg font-semibold mb-1">Not Available</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contentRecord = asContentRecord(data?.content ?? null);
  const sections = getSections(contentRecord);
  const title =
    (typeof contentRecord?.title === 'string' ? contentRecord.title : null) ??
    'Product Requirements Document';
  const versionSummary =
    typeof contentRecord?.version_summary === 'string' ? contentRecord.version_summary : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-display text-sm font-bold">Zedos</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            Read-only
          </Badge>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <FadeIn>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline">v{data?.versionNumber ?? 1}</Badge>
            </div>
            {versionSummary ? (
              <p className="mt-3 text-sm text-muted-foreground">{versionSummary}</p>
            ) : null}
          </div>
        </FadeIn>

        <Stagger staggerDelay={0.05}>
          <div className="space-y-3">
            {sections.map((sectionUnknown, i) => {
              const section =
                sectionUnknown && typeof sectionUnknown === 'object' && !Array.isArray(sectionUnknown)
                  ? (sectionUnknown as Record<string, unknown>)
                  : {};
              const key = typeof section.id === 'string' ? section.id : `s-${i}`;
              const secTitle =
                typeof section.title === 'string' ? section.title : 'Section';
              const secContent =
                typeof section.content === 'string' ? section.content : 'No content';
              const confidence =
                typeof section.confidence === 'string' ? section.confidence : '';

              return (
                <StaggerItem key={key}>
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-display">{secTitle}</CardTitle>
                        {confidence ? (
                          <Badge
                            variant="secondary"
                            className={`text-xs gap-1 ${getConfidenceColor(confidence)}`}
                          >
                            {getConfidenceIcon(confidence)}
                            {confidence}
                          </Badge>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">{secContent}</div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              );
            })}
          </div>
        </Stagger>

        {sections.length === 0 && contentRecord ? (
          <Card>
            <CardContent className="p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {JSON.stringify(contentRecord, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ) : null}

        {sections.length === 0 && data?.content !== null && !contentRecord && data?.content != null ? (
          <Card>
            <CardContent className="p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {typeof data.content === 'string'
                  ? data.content
                  : JSON.stringify(data.content, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ) : null}

        <div className="text-center pt-8 pb-4">
          <p className="text-xs text-muted-foreground">
            Generated with Zedos · AI-guided product clarification
          </p>
        </div>
      </div>
    </div>
  );
}
