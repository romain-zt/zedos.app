---
name: http
description: HTTP/API contract doctrine — designing and testing route handlers, REST/RPC endpoints, status codes, idempotency, pagination, auth, webhooks (inbound). Use when defining or implementing an HTTP surface, or writing contract tests for one. Manager-tier.
disable-model-invocation: true
---

# HTTP / API Contracts

Use when shaping or implementing an HTTP surface. The contract is the source of
truth and is **contract-tested** (not e2e). Read `.cursor/core/rules/30-test-strategy.mdc`.

## Design rules

- **Contract-first.** Define request, response, status codes, and errors before code; they live in the Spec `## Contract`.
- **Status codes:** 2xx success, 4xx client (validation/authz), 5xx server. Don't 200 an error.
- **Idempotency:** non-GET that can be retried needs an idempotency key or natural idempotence. Document it.
- **Auth on every route.** State who may call it; default deny.
- **Validation at the boundary.** Reject malformed input with a typed error; never trust the client.
- **Pagination/filtering:** cursor-based by default for lists; cap page size.
- **Versioning:** external/long-lived surfaces are versioned; breaking change = new version.
- **Inbound webhooks:** verify signature, enforce idempotency (dedupe by event id), support replay, respond fast (ack then process async). See the `event` skill for the processing side.

## Contract test (both sides)

For each endpoint, pin a contract test asserting:

- request schema accepted / bad request rejected
- response schema + status for success
- **every Contract `Errors` row** → its status + code
- auth: unauthorized/forbidden cases
- idempotency: replay yields the same effect

Producer and consumer assert the **same** contract artifact. Prefer this over an e2e.

## Output

```txt
HTTP contract — <route>

Method + path: <...>
Auth: <who | public>
Request: <schema>
Responses: <status → schema>
Errors: | code | status | when | message |
Idempotency: <key | natural | n/a>
Tests (contract): <list, traced to ACs/errors>
```

## Anti-patterns

- Returning 200 with an error body.
- Unauthenticated mutating routes.
- Webhook handlers without signature check + idempotency.
- Testing an API surface through the browser (use contract tests).
- Unbounded list endpoints.
