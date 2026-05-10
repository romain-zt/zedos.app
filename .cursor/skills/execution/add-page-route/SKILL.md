---
name: add-page-route
description: Adds an App Router page (`page.tsx`) with the required loading.tsx, error.tsx, not-found.tsx (when dynamic), and metadata. Server-component-by-default; data fetched via use cases, never raw prisma.
disable-model-invocation: true
---

# Add Page Route

Use when the Implementation Plan adds a new page under `app/**/page.tsx`. Pages render the user-facing surface; route handlers and server actions handle mutations.

## When to use

- The Plan adds a route segment that renders UI.
- Data is fetched server-side (server component default).
- The Plan touches `app/` for a page (not just an API route).

## Read first

- `.cursor/rules/77-nextjs.mdc` §6, §7 (boundaries, pages and layouts)
- `.cursor/rules/74-contracts-zod.mdc` (DTO types via `z.infer`)
- `.cursor/rules/76-better-auth.mdc` §4 (server-side guards in pages)

## Recipe

### Step 1 — Decide segment boundary files

Every dynamic-data page segment ships:

| File | When |
|------|------|
| `page.tsx` | Always |
| `loading.tsx` | Page does any data fetch > 200ms |
| `error.tsx` | Page does any data fetch (catches thrown exceptions) |
| `not-found.tsx` | Segment has dynamic params (`[id]`) and the resource may not exist |

### Step 2 — Author the page

```tsx
// app/dashboard/projects/[id]/page.tsx
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { useCases } from '@/lib/composition';
import { requireUser } from '@infrastructure/auth';
import { ProjectHeader } from '@/components/project-header';
import { PrdVersionList } from '@/components/prd-version-list';

export const metadata = {
  title: 'Project | Zedos',
};

interface Props {
  params: { id: string };
}

export default async function ProjectPage({ params }: Props) {
  const user = await requireUser(headers());
  if (user.isErr()) redirect('/login');

  const result = await useCases.getProject({ id: params.id, userId: user.unwrap().id });

  if (result.isErr()) {
    if (result.error.code === 'NotFound') notFound();
    throw result.error; // caught by error.tsx
  }

  const project = result.unwrap();
  return (
    <div>
      <ProjectHeader project={project} />
      <PrdVersionList projectId={project.id} />
    </div>
  );
}
```

Hard rules:

- Server component by default. Do **not** add `'use client'` to a page that does data fetching.
- Data fetched via use cases — never `prisma.*` or `db.*` directly.
- Auth via `requireUser(headers())`.
- `notFound()` for missing resource; `redirect()` for unauthorized; `throw` for unexpected errors (caught by `error.tsx`).
- `metadata` exported (title minimum); `metadata.robots = { index: false, follow: false }` for share-link pages.

### Step 3 — Author `loading.tsx`

```tsx
// app/dashboard/projects/[id]/loading.tsx
import { ProjectHeaderSkeleton } from '@/components/project-header';

export default function Loading() {
  return <ProjectHeaderSkeleton />;
}
```

### Step 4 — Author `error.tsx`

```tsx
// app/dashboard/projects/[id]/error.tsx
'use client';

import { useEffect } from 'react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    // Server-side logger redacts; do not log raw error here.
    console.error('project_page_error', { digest: error.digest });
  }, [error]);

  return (
    <div>
      <p>Something went wrong loading this project.</p>
      <button type="button" onClick={reset}>Try again</button>
    </div>
  );
}
```

### Step 5 — Author `not-found.tsx` (when dynamic params)

```tsx
// app/dashboard/projects/[id]/not-found.tsx
export default function NotFound() {
  return <div>Project not found.</div>;
}
```

### Step 6 — Test (Playwright e2e for critical journeys)

Per `78-testing.mdc`, Playwright covers user-journey-level pages. Unit-test individual components separately.

```typescript
// apps/web/e2e/project-detail.spec.ts
import { test, expect } from '@playwright/test';

test('owner can view their project', async ({ page }) => { /* ... */ });
test('non-owner gets 404 for an unknown project', async ({ page }) => { /* ... */ });
```

### Step 7 — Verify

Route to `verifier`.

## Failure modes

| Failure | Fix |
|---------|-----|
| `prisma.*` in `page.tsx` | Move to a use case; consume from composition root |
| Missing `error.tsx` for a data-fetching page | Add it |
| `'use client'` on the whole page | Move to the smallest interactive child |
| Missing `metadata.robots` on share-link page | Add it (PRD requirement) |
| `requireSession` not used | Add it; redirect or throw on `Result.err` |

## Hard rules

- Server-component-by-default; client components are leaves.
- No `prisma.*` / `db.*` in pages — always use cases.
- Every dynamic-data segment has `loading.tsx` and `error.tsx`.
- Share-link pages noindex; per PRD §"Hard v0 exclusions".
