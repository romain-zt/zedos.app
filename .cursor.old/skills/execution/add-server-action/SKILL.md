---
name: add-server-action
description: Adds a Next.js Server Action with progressive enhancement, zod-validated input, discriminated `{ ok: true } | { ok: false, error }` return shape, and revalidatePath discipline. Use when implementing a same-app form or button-driven mutation.
disable-model-invocation: true
---

# Add Server Action

Use when the Implementation Plan adds a server action — invoked directly from a server component or via a `<form action={fn}>` — and not consumed by external clients.

## When to use

- The Plan's `Touched Files` includes a file under `app/.../_actions/<action>.ts`.
- The mutation is consumed by the same app (no external API contract).
- Progressive enhancement matters (form must work even with JS disabled).
- Plan does not also add a route handler for the same operation.

## Read first

- `.cursor/rules/77-nextjs.mdc` §5 (server action conventions)
- `.cursor/rules/74-contracts-zod.mdc` (request validation)
- `.cursor/rules/73-result-rop.mdc` (Result-to-discriminated-shape mapping)

## Recipe

### Step 1 — Confirm the contract

The Plan must list a `<Resource>RequestSchema` in `contracts/<resource>/`. The action's `formData` is parsed against it.

### Step 2 — Confirm the use case

The action must call a use case in `application/<context>/`. If missing, route to `add-usecase` first.

### Step 3 — Author the action

```typescript
// app/dashboard/projects/_actions/create-project.ts
'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { CreateProjectRequestSchema } from '@contracts/project';
import { useCases } from '@/lib/composition';
import { requireSession } from '@infrastructure/auth';

export async function createProjectAction(formData: FormData) {
  const session = await requireSession(headers());
  if (session.isErr()) {
    return { ok: false as const, error: 'unauthorized' };
  }

  const parsed = CreateProjectRequestSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      error: 'invalid_input',
      details: parsed.error.flatten(),
    };
  }

  const result = await useCases.createProject(parsed.data, session.unwrap().user.id);
  if (result.isErr()) {
    return { ok: false as const, error: result.error.code };
  }

  revalidatePath('/dashboard/projects');
  return { ok: true as const, project: result.unwrap() };
}
```

Hard rules:

- `'use server'` directive at the top.
- Lives in `_actions/` (server-only convention).
- Returns discriminated `{ ok: true, ... } | { ok: false, error, ... }`. **Never throws to the client.**
- `revalidatePath` / `revalidateTag` belongs to the action — not the use case.
- Auth via `requireSession(headers())`.

### Step 4 — Wire from a server component or form

```tsx
// app/dashboard/projects/new/page.tsx
import { createProjectAction } from '../_actions/create-project';

export default function NewProjectPage() {
  return (
    <form action={createProjectAction}>
      <input name="name" required minLength={1} maxLength={255} />
      <input name="description" maxLength={2000} />
      <button type="submit">Create</button>
    </form>
  );
}
```

For client-side enhancement, wrap the action in a small `'use client'` component that handles the discriminated return.

### Step 5 — Test

```typescript
// app/dashboard/projects/_actions/create-project.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createProjectAction } from './create-project';

describe('createProjectAction', () => {
  it('returns invalid_input when name is missing', async () => {
    const fd = new FormData();
    const res = await createProjectAction(fd);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('invalid_input');
  });

  it('returns ok and project on success', async () => { /* ... */ });
});
```

### Step 6 — Verify

Route to `verifier`.

## Failure modes

| Failure | Fix |
|---------|-----|
| Action throws to the client | Wrap return in discriminated `{ ok }` shape |
| `revalidatePath` called inside the use case | Move to the action |
| Action accepts `userId` from formData | Derive from `requireSession(headers())` |
| No test | Add a unit test |
| Action contains business logic | Extract use case |

## Hard rules

- Discriminated return type — no thrown errors crossing into the client.
- `revalidatePath` / `revalidateTag` is the action's job.
- Auth from session, never from form input.
- One action per file. `_actions/` is server-only.
- Tests are unit-level (mock the use case via DI or the composition root).
