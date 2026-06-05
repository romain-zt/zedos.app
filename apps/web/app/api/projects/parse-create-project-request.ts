import { z } from 'zod';
import {
  CreateProjectRequestSchema,
  CreateProjectImportPasteSchema,
  JourneyModeSchema,
} from '@repo/contracts/project';
import { TemplateSlugSchema, type TemplateSlug } from '@repo/contracts/templates';
import {
  buildImportedPrdVersionContent,
  parseImportedPrdUploadFile,
  validateImportedPrdText,
} from '@/lib/prd-import-at-create';
import type { PrdVersionContent } from '@repo/contracts/prd';

export type ParsedCreateProjectRequest = {
  name: string;
  description: string | null;
  journeyMode: z.infer<typeof JourneyModeSchema>;
  importedPrd: PrdVersionContent | null;
  templateSlug: TemplateSlug | null;
};

function fieldString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (value == null) return null;
  if (typeof value === 'string') return value;
  return null;
}

export async function parseCreateProjectRequest(
  request: Request
): Promise<
  | { ok: true; data: ParsedCreateProjectRequest }
  | { ok: false; message: string; status: number }
> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const name = fieldString(formData, 'name')?.trim() ?? '';
    const description = fieldString(formData, 'description');
    const journeyRaw = fieldString(formData, 'journeyMode');
    const journeyParsed = JourneyModeSchema.safeParse(journeyRaw ?? 'standard');
    const journeyMode = journeyParsed.success ? journeyParsed.data : 'standard';
    const templateSlugRaw = fieldString(formData, 'templateSlug');

    if (!name) {
      return { ok: false, message: 'Project name is required', status: 400 };
    }

    const templateSlugParsed = templateSlugRaw
      ? TemplateSlugSchema.safeParse(templateSlugRaw)
      : null;
    if (templateSlugParsed && !templateSlugParsed.success) {
      return { ok: false, message: 'Invalid template slug', status: 400 };
    }
    const templateSlug = templateSlugParsed?.data ?? null;

    const importKind = fieldString(formData, 'importKind');

    if (templateSlug && importKind && importKind !== 'none') {
      return {
        ok: false,
        message: 'Cannot combine an import payload with a template slug',
        status: 400,
      };
    }

    if (!importKind || importKind === 'none') {
      const parsed = CreateProjectRequestSchema.safeParse({
        name,
        description,
        journeyMode,
        ...(templateSlug ? { templateSlug } : {}),
      });
      if (!parsed.success) {
        return {
          ok: false,
          message: parsed.error.issues[0]?.message ?? 'Validation error',
          status: 400,
        };
      }
      return {
        ok: true,
        data: {
          name: parsed.data.name,
          description: parsed.data.description ?? null,
          journeyMode: parsed.data.journeyMode,
          importedPrd: null,
          templateSlug: parsed.data.templateSlug ?? null,
        },
      };
    }

    if (importKind === 'paste') {
      const pasteText = fieldString(formData, 'importText') ?? '';
      const pasteParsed = CreateProjectImportPasteSchema.safeParse({
        name,
        description,
        journeyMode,
        import: { kind: 'paste', text: pasteText },
      });
      if (!pasteParsed.success) {
        return {
          ok: false,
          message: pasteParsed.error.issues[0]?.message ?? 'Invalid import paste',
          status: 400,
        };
      }
      const content = buildImportedPrdVersionContent(
        pasteParsed.data.import.text,
        pasteParsed.data.name,
        { format: 'paste' }
      );
      return {
        ok: true,
        data: {
          name: pasteParsed.data.name,
          description: pasteParsed.data.description ?? null,
          journeyMode: pasteParsed.data.journeyMode,
          importedPrd: content,
          templateSlug: null,
        },
      };
    }

    if (importKind === 'file') {
      const fileEntry = formData.get('importFile');
      if (!(fileEntry instanceof File) || fileEntry.size === 0) {
        return { ok: false, message: 'Choose a .md or .txt file to import', status: 400 };
      }
      try {
        const parsedFile = await parseImportedPrdUploadFile(fileEntry);
        const content = buildImportedPrdVersionContent(parsedFile.text, name, {
          format: 'upload',
          filename: parsedFile.filename,
        });
        return {
          ok: true,
          data: {
            name,
            description: description?.trim() || null,
            journeyMode,
            importedPrd: content,
            templateSlug: null,
          },
        };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Invalid import file';
        return { ok: false, message, status: 400 };
      }
    }

    return { ok: false, message: 'Invalid import kind', status: 400 };
  }

  let raw: unknown = {};
  try {
    raw = await request.json();
  } catch {
    return { ok: false, message: 'Invalid JSON body', status: 400 };
  }

  const withImport = z
    .object({
      name: z.string(),
      description: z.string().optional().nullable(),
      journeyMode: JourneyModeSchema.optional(),
      importPaste: z.string().optional(),
      templateSlug: TemplateSlugSchema.optional(),
    })
    .safeParse(raw);

  if (!withImport.success) {
    return { ok: false, message: 'Invalid request body', status: 400 };
  }

  const { importPaste, templateSlug, ...rest } = withImport.data;

  if (templateSlug && importPaste != null && importPaste.trim() !== '') {
    return {
      ok: false,
      message: 'Cannot combine an import payload with a template slug',
      status: 400,
    };
  }

  if (importPaste != null && importPaste.trim() !== '') {
    const pasteParsed = CreateProjectImportPasteSchema.safeParse({
      name: rest.name,
      description: rest.description,
      journeyMode: rest.journeyMode,
      import: { kind: 'paste', text: importPaste },
    });
    if (!pasteParsed.success) {
      return {
        ok: false,
        message: pasteParsed.error.issues[0]?.message ?? 'Invalid import paste',
        status: 400,
      };
    }
    const content = buildImportedPrdVersionContent(
      pasteParsed.data.import.text,
      pasteParsed.data.name,
      { format: 'paste' }
    );
    return {
      ok: true,
      data: {
        name: pasteParsed.data.name,
        description: pasteParsed.data.description ?? null,
        journeyMode: pasteParsed.data.journeyMode,
        importedPrd: content,
        templateSlug: null,
      },
    };
  }

  const parsed = CreateProjectRequestSchema.safeParse({
    ...rest,
    ...(templateSlug ? { templateSlug } : {}),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Validation error',
      status: 400,
    };
  }

  return {
    ok: true,
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      journeyMode: parsed.data.journeyMode,
      importedPrd: null,
      templateSlug: parsed.data.templateSlug ?? null,
    },
  };
}

/** Client-side paste validation before submit (same rules as server). */
export function validateImportPasteClient(text: string): string | null {
  return validateImportedPrdText(text);
}
