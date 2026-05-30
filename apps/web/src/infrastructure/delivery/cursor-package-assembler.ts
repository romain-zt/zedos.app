/**
 * Assembles PD-001 delivery artifacts and ZIP archive (in-memory).
 *
 * ZIP layout:
 *   {story-slug}/
 *     01-{task-slug}.md   ← full prompt for each task
 *   WORK_QUEUE.md
 *   .cursor/README.md
 */

import archiver from 'archiver';
import type { ExportEligibleBundle } from '@domain/delivery/export-bundle';
import type { ICursorPackageAssembler } from '@domain/delivery/cursor-package-assembler-port';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, ExternalServiceError } from '@shared/errors/application-error';

export type PackageFile = {
  path: string;
  content: string;
};

/** Converts a string to a safe directory/file slug (lowercase, hyphens, no specials). */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    || 'untitled';
}

const WORK_QUEUE_HEADER =
  '| ID | Type | Parent | Status | Priority | NEED_HUMAN | NEED_UPDATE | Blocked By | Next Action |\n' +
  '|---|---|---|---|:---:|:---:|:---:|---|---|\n';

export function buildWorkQueueMarkdown(bundles: ExportEligibleBundle[]): string {
  const rows: string[] = [WORK_QUEUE_HEADER];
  for (const bundle of bundles) {
    const storySlug = toSlug(bundle.storyTitle);
    for (const task of bundle.tasks) {
      const rowId = `DEL-${bundle.id.slice(0, 8)}-T${task.sortOrder}`;
      const parent = bundle.storyTitle.replace(/\|/g, '\\|');
      const taskSlug = `${String(task.sortOrder + 1).padStart(2, '0')}-${toSlug(task.title)}`;
      rows.push(
        `| ${rowId} | Task | ${parent} | queued | P2 | false | false | — | [${task.title.replace(/\|/g, '\\|')}](${storySlug}/${taskSlug}.md) |\n`
      );
    }
  }
  return `# WORK_QUEUE — Zedos delivery export\n\n${rows.join('')}`;
}

export function buildTaskMarkdown(bundle: ExportEligibleBundle, taskIndex: number): string {
  const task = bundle.tasks[taskIndex];
  if (!task) return '';
  return [
    `# Task: ${task.title}`,
    '',
    `> Story: **${bundle.storyTitle}**`,
    '',
    task.promptBody.trim(),
    '',
  ].join('\n');
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
        '- Start from `WORK_QUEUE.md` for the ordered task list.',
        '- Each story has its own folder. Open the task `.md` files for the full implementation prompt.',
        '',
      ].join('\n'),
    },
  ];

  for (const bundle of bundles) {
    const storySlug = toSlug(bundle.storyTitle);
    for (let i = 0; i < bundle.tasks.length; i++) {
      const task = bundle.tasks[i];
      if (!task) continue;
      const taskSlug = `${String(task.sortOrder + 1).padStart(2, '0')}-${toSlug(task.title)}`;
      files.push({
        path: `${storySlug}/${taskSlug}.md`,
        content: buildTaskMarkdown(bundle, i),
      });
    }
  }

  return files;
}

export function zipPackageFiles(files: PackageFile[]): Promise<Result<Buffer, ApplicationError>> {
  return new Promise((resolve) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    archive.on('error', (archiveError: Error) => {
      const message = archiveError instanceof Error ? archiveError.message : 'ZIP assembly failed';
      resolve(err(new ExternalServiceError('archiver', message, 502)));
    });
    archive.on('end', () => {
      resolve(ok(Buffer.concat(chunks)));
    });

    for (const file of files) {
      archive.append(file.content, { name: file.path });
    }

    void archive.finalize();
  });
}

export async function assembleDeliveryZip(
  bundles: ExportEligibleBundle[]
): Promise<Result<Buffer, ApplicationError>> {
  try {
    const files = buildPackageFiles(bundles);
    return await zipPackageFiles(files);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'ZIP assembly failed';
    return err(new ExternalServiceError('archiver', message, 502));
  }
}

export class CursorPackageAssembler implements ICursorPackageAssembler {
  assembleZip(bundles: ExportEligibleBundle[]): Promise<Result<Buffer, ApplicationError>> {
    return assembleDeliveryZip(bundles);
  }
}
