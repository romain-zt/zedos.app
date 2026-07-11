# Payload app routes

Payload 3 serves its admin + API from a Next.js route group `app/(payload)/`.
That route group is **generated boilerplate** (stable re-exports of
`@payloadcms/next`), so it is not hand-checked into this template.

Generate it once after forking:

```bash
# from apps/cms
npx create-payload-app@latest --no-deps   # pick "use current dir", Postgres
# or copy the (payload) route group from a fresh Payload 3 app:
#   app/(payload)/layout.tsx
#   app/(payload)/admin/[[...segments]]/page.tsx
#   app/(payload)/admin/[[...segments]]/not-found.tsx
#   app/(payload)/api/[...slug]/route.ts
#   app/(payload)/api/graphql/route.ts
#   app/(payload)/api/graphql-playground/route.ts
```

All of these import the config via the `@payload-config` alias, already set in
`tsconfig.json`. After generating, run `pnpm --filter cms generate:types`.

The collections, db, S3, and i18n config in `src/payload.config.ts` are the parts
you actually own — the route group is plumbing.
