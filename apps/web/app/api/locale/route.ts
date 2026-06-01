import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const LocaleBodySchema = z.object({
  locale: z.enum(['en', 'fr']),
});

const LOCALE_COOKIE = 'zedos_locale';

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = LocaleBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true, locale: parsed.data.locale });
  response.cookies.set(LOCALE_COOKIE, parsed.data.locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  return response;
}
