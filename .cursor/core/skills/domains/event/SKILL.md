---
name: event
description: Event & async doctrine — domain events, background jobs/queues, cron, outbound webhooks, delivery semantics (at-least-once, idempotency, ordering, retries, DLQ). Use when a Spec emits/consumes events, schedules work, or processes inbound webhooks asynchronously. Manager-tier.
disable-model-invocation: true
---

# Events & Async Work

Use when work happens outside the request/response cycle. Feeds the Spec
`## Async / Event / Webhook / Cron / Stream` section (SP-15). Read
`.cursor/core/rules/40-architecture-baseline.mdc` and `.cursor/core/rules/30-test-strategy.mdc`.

## When to go async (any of)

- Operation exceeds ~2s (LLM call, big query, external API, file processing).
- An external system calls back on its own timeline (webhook).
- Work must survive the request (email, retries, batch).
- Another Spec/worker depends on something happening (domain event).

## Delivery semantics — state them explicitly

For each event/job, decide and document:

- **Delivery:** at-least-once (default) → consumers must be **idempotent** (dedupe by event id / natural key).
- **Ordering:** required? If yes, partition by key; otherwise assume unordered.
- **Retries + backoff:** bounded; after N attempts → **dead-letter** + alert.
- **Producer/consumer contract:** event type + payload schema, versioned; the consumer validates it.

## Patterns on this stack

- **Domain event:** emit after a Payload `afterChange` (or transaction commit); persist an outbox row if the consumer must not miss it (transactional outbox > fire-and-forget).
- **Background job:** enqueue + a worker; idempotency key per job; record terminal state.
- **Cron:** name the schedule, the worker, idempotency (safe to run twice), and what it reconciles.
- **Outbound webhook:** sign payloads, retry with backoff, expose delivery status, let consumers replay.

## Testing (no e2e)

- **Contract test** the event/payload schema (producer emits it; consumer parses it).
- **Unit test** the consumer's idempotency (same event twice = one effect) and retry/backoff logic.
- **Integration test** producer→queue→consumer against local infra; assert terminal state and DLQ on poison messages.

## Output

```txt
Async design — <feature>

Trigger: <long-op | webhook | schedule | domain event>
Event/job: <type> — payload schema (versioned)
Producer: <where emitted> — outbox? <yes/no>
Consumer: <worker> — idempotency key — ordering
Retries: <n + backoff> → DLQ: <where>
Tests: contract (schema) + unit (idempotency/retry) + integration (flow)
```

## Anti-patterns

- Fire-and-forget where loss matters (use an outbox).
- Non-idempotent consumers on at-least-once delivery.
- Unbounded retries / no DLQ.
- Hidden async work not declared in the Spec SP-15 section.
- E2E to test an event flow (use contract + integration).
