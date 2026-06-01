/**
 * Assembles PD-001 delivery artifacts and ZIP archive (in-memory).
 */

import archiver from 'archiver';
import type { ExportEligibleBundle } from '@domain/delivery/export-bundle';
import type { ICursorPackageAssembler } from '@domain/delivery/cursor-package-assembler-port';

export type PackageFile = {
  path: string;
  content: string;
};

const WORK_QUEUE_HEADER =
  '| ID | Type | Parent | Status | Priority | NEED_HUMAN | NEED_UPDATE | Blocked By | Next Action |\n' +
  '|---|---|---|---|:---:|:---:|:---:|---|---|\n';

export function buildWorkQueueMarkdown(bundles: ExportEligibleBundle[]): string {
  const rows: string[] = [WORK_QUEUE_HEADER];
  for (const bundle of bundles) {
    for (const task of bundle.tasks) {
      const rowId = `DEL-${bundle.id.slice(0, 8)}-T${task.sortOrder}`;
      const parent = bundle.storyTitle.replace(/\|/g, '\\|');
      rows.push(
        `| ${rowId} | Task | ${parent} | queued | P2 | false | false | — | ${task.title.replace(/\|/g, '\\|')} |\n`
      );
    }
  }
  return `# WORK_QUEUE — Zedos delivery export\n\n${rows.join('')}`;
}

export function buildStoryMarkdown(bundle: ExportEligibleBundle): string {
  const lines: string[] = [
    `# User Story: ${bundle.storyTitle}`,
    '',
    '## Status',
    '',
    '`ready-for-implementation` (exported from Zedos)',
    '',
    '## Story',
    '',
    bundle.storyBody.trim() || '_No narrative body on bundle snapshot._',
    '',
    '## Tasks and prompts',
    '',
  ];

  for (const task of bundle.tasks) {
    lines.push(
      `### ${task.sortOrder + 1}. ${task.title}`,
      '',
      '```text',
      task.promptBody,
      '```',
      ''
    );
  }

  return lines.join('\n');
}

export function buildPackageFiles(bundles: ExportEligibleBundle[]): PackageFile[] {
  const files: PackageFile[] = [
    {
      path: 'WORK_QUEUE.md',
      content: buildWorkQueueMarkdown(bundles),
    },
    {
      path: '.cursor/README.md',
      content: [
        '# Zedos delivery package',
        '',
        'Drop this folder into your repository root and open it in Cursor.',
        '',
        '- Start from `WORK_QUEUE.md` for ordered tasks.',
        '- Per-story detail lives under `docs/execution/user-stories/`.',
        '',
      ].join('\n'),
    },
  ];

  for (const bundle of bundles) {
    const safeId = bundle.id.replace(/[^a-zA-Z0-9-_]/g, '-');
    files.push({
      path: `docs/execution/user-stories/${safeId}.md`,
      content: buildStoryMarkdown(bundle),
    });
  }

  return files;
}

export function zipPackageFiles(files: PackageFile[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    archive.on('error', (archiveError: Error) => {
      reject(archiveError);
    });
    archive.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    for (const file of files) {
      archive.append(file.content, { name: file.path });
    }

    void archive.finalize();
  });
}

export async function assembleDeliveryZip(bundles: ExportEligibleBundle[]): Promise<Buffer> {
  const files = buildPackageFiles(bundles);
  return zipPackageFiles(files);
}

export class CursorPackageAssembler implements ICursorPackageAssembler {
  assembleZip(bundles: ExportEligibleBundle[]): Promise<Buffer> {
    return assembleDeliveryZip(bundles);
  }
}
