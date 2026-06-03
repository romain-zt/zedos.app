import { z } from 'zod';
import { GeneratePrdAiResponseSchema } from '../ai/generate-prd-stream';
import { EXPRESS_PRD_SECTION_IDS } from './deliverable-kind';

export function parseExpressGeneratePrdAiResponse(
  data: unknown
): z.SafeParseReturnType<z.infer<typeof GeneratePrdAiResponseSchema>, z.infer<typeof GeneratePrdAiResponseSchema>> {
  const base = GeneratePrdAiResponseSchema.safeParse(data);
  if (!base.success) {
    return base;
  }
  const present = new Set(base.data.sections.map((s) => s.id));
  const missing = EXPRESS_PRD_SECTION_IDS.filter((id) => !present.has(id));
  if (missing.length > 0) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: 'custom',
          message: `Express livrable missing sections: ${missing.join(', ')}`,
          path: ['sections'],
        },
      ]),
    };
  }
  return base;
}
