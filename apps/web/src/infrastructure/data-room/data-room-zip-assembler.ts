/**
 * Assembles the team data-room zip — README + PRD (markdown + JSON) + decisions index
 * + ADR files + user-story index + share-link index + MANIFEST.json.
 *
 * Pattern mirrors `cursor-package-assembler.ts`: build a `PackageFile[]`, then zip.
 */

import archiver from 'archiver';
import type {
  IDataRoomAssembler,
  DataRoomBundleSources,
  DataRoomBundleArtifact,
} from '@domain/data-room';
import type { DataRoomManifest, DataRoomManifestEntry } from '@repo/contracts/data-room';
import { buildDecisionsExportJson } from '@application/decision-graph/build-decisions-export-json';

type PackageFile = {
  path: string;
  content: string;
  contentType: string;
};

function jsonString(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function buildReadme(sources: DataRoomBundleSources): string {
  const warnings = sources.expressFlags
    .map((f) => `- **Section ${f.sectionId}** — ${f.reason}`)
    .join('\n');
  return [
    `# ${sources.projectName} — Team data room bundle`,
    '',
    `Generated ${new Date().toISOString()}.`,
    '',
    '## Contents',
    '',
    '- `prd/` — Latest PRD version (markdown + raw JSON)',
    '- `decisions/index.json` — Owner decision log (chosen + rejected options, owner comments)',
    '- `adrs/` — Architectural Decision Records (one file per ADR)',
    '- `user-stories/index.md` — Title-level index of the user-story corpus',
    '- `share-links/index.json` — Read-only share link inventory (tokens redacted)',
    '- `MANIFEST.json` — File list + sizes',
    '',
    '## Disclaimer',
    '',
    'This bundle is owner-private. Sensitive integration tokens, payment identifiers, and personal account data are intentionally excluded. Share links are listed by id only; the join token is **never** included in this bundle.',
    '',
    warnings.length > 0 ? `## Express-mode warnings\n\n${warnings}\n` : '',
  ].join('\n');
}

function buildPrdMarkdown(prd: DataRoomBundleSources['prdVersion']): string {
  if (prd === null) return '# PRD\n\nNo PRD version present for this project.\n';
  const versionLabel = `v${prd.versionNumber}`;
  const header = `# PRD ${versionLabel} (status: ${prd.status}, deliverable: ${prd.deliverableKind})\n\n`;
  if (prd.content === null) {
    return `${header}_PRD content is null (placeholder)._\n`;
  }
  return `${header}\`\`\`json\n${jsonString(prd.content)}\n\`\`\`\n`;
}

function buildAdrMarkdown(adr: DataRoomBundleSources['adrs'][number]): string {
  return [
    `# ADR-${String(adr.adrNumber).padStart(2, '0')} — ${adr.title}`,
    '',
    `Status: ${adr.status}`,
    '',
    adr.content,
    '',
  ].join('\n');
}

function buildStoriesIndex(
  stories: DataRoomBundleSources['userStoryTitles'],
): string {
  if (stories.length === 0) return '# User stories\n\n_No corpus persisted yet._\n';
  const lines = ['# User stories', ''];
  const byCluster = new Map<string, DataRoomBundleSources['userStoryTitles']>();
  for (const s of stories) {
    const list = byCluster.get(s.clusterLabel) ?? [];
    list.push(s);
    byCluster.set(s.clusterLabel, list);
  }
  for (const [cluster, items] of byCluster.entries()) {
    lines.push(`## ${cluster}`, '');
    items
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .forEach((item) => lines.push(`- ${item.title}`));
    lines.push('');
  }
  return lines.join('\n');
}

function buildShareIndex(
  shareLinks: DataRoomBundleSources['shareLinks'],
): string {
  return jsonString({
    shareLinks: shareLinks.map((sl) => ({
      id: sl.id,
      enabled: sl.enabled,
      prdVersionNumber: sl.prdVersionNumber,
      createdAt: sl.createdAt.toISOString(),
      expiresAt: sl.expiresAt !== null ? sl.expiresAt.toISOString() : null,
      disabledAt: sl.disabledAt !== null ? sl.disabledAt.toISOString() : null,
    })),
  });
}

function buildManifest(
  projectId: string,
  files: PackageFile[],
  warnings: string[],
): DataRoomManifest {
  const entries: DataRoomManifestEntry[] = files.map((f) => ({
    path: f.path,
    byteSize: Buffer.byteLength(f.content, 'utf8'),
    contentType: f.contentType,
  }));
  const totalByteSize = entries.reduce((sum, e) => sum + e.byteSize, 0);
  return {
    projectId,
    generatedAt: new Date().toISOString(),
    fileCount: entries.length,
    totalByteSize,
    files: entries,
    warnings,
  };
}

function zipFiles(files: PackageFile[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.on('error', (e: Error) => reject(e));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    for (const f of files) archive.append(f.content, { name: f.path });
    void archive.finalize();
  });
}

export class DataRoomZipAssembler implements IDataRoomAssembler {
  async assemble(sources: DataRoomBundleSources): Promise<DataRoomBundleArtifact> {
    const warnings: string[] = sources.expressFlags.map(
      (f) => `${f.sectionId}: ${f.reason}`,
    );

    const files: PackageFile[] = [];

    files.push({
      path: 'README.md',
      content: buildReadme(sources),
      contentType: 'text/markdown',
    });

    const prdLabel = sources.prdVersion !== null ? `v${sources.prdVersion.versionNumber}` : 'none';
    files.push({
      path: `prd/${prdLabel}.md`,
      content: buildPrdMarkdown(sources.prdVersion),
      contentType: 'text/markdown',
    });
    if (sources.prdVersion !== null) {
      files.push({
        path: `prd/${prdLabel}.json`,
        content: jsonString({
          id: sources.prdVersion.id,
          versionNumber: sources.prdVersion.versionNumber,
          status: sources.prdVersion.status,
          deliverableKind: sources.prdVersion.deliverableKind,
          content: sources.prdVersion.content,
          createdAt: sources.prdVersion.createdAt.toISOString(),
        }),
        contentType: 'application/json',
      });
    }

    const decisionsJson = buildDecisionsExportJson(sources.projectId, sources.decisions);
    files.push({
      path: 'decisions/index.json',
      content: jsonString(decisionsJson),
      contentType: 'application/json',
    });

    for (const adr of sources.adrs) {
      const num = String(adr.adrNumber).padStart(2, '0');
      files.push({
        path: `adrs/ADR-${num}.md`,
        content: buildAdrMarkdown(adr),
        contentType: 'text/markdown',
      });
    }

    files.push({
      path: 'user-stories/index.md',
      content: buildStoriesIndex(sources.userStoryTitles),
      contentType: 'text/markdown',
    });

    files.push({
      path: 'share-links/index.json',
      content: buildShareIndex(sources.shareLinks),
      contentType: 'application/json',
    });

    const manifest = buildManifest(sources.projectId, files, warnings);
    files.push({
      path: 'MANIFEST.json',
      content: jsonString(manifest),
      contentType: 'application/json',
    });

    const zipBuffer = await zipFiles(files);

    return {
      zipBuffer,
      manifest,
      filename: `zedos-data-room-${sources.projectId.slice(0, 8)}.zip`,
    };
  }
}
