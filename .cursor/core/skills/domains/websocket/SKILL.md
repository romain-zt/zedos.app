---
name: websocket
description: Real-time push doctrine — choosing SSE vs WebSocket, channel/topic design, message contracts, auth on the socket, reconnection/backpressure, and when polling is fine. Use when a Spec needs server-to-client updates without polling. Manager-tier.
disable-model-invocation: true
---

# Real-time (SSE / WebSocket)

Use when the client must receive updates without polling. Feeds the Spec
`## Async / Event / Webhook / Cron / Stream` (sub-question 5).

## Choose the transport

| Need | Use |
|------|-----|
| Server → client only (notifications, progress, LLM token stream) | **SSE / ReadableStream** (simpler, HTTP, auto-reconnect) |
| Bidirectional, low latency (chat, presence, collaborative editing) | **WebSocket** |
| Update is rare / not latency-sensitive | **Polling on render** — state it explicitly; don't add a socket |

Default to the simplest that meets the need. In v0, "polling-on-render acceptable" is a valid, documented choice.

## Design rules

- **Auth the connection** at handshake; re-check authorization per subscribed topic. Never trust a topic name from the client without an authz check.
- **Channels/topics** scoped to a resource the user may access (e.g. `project:{id}`); document the naming.
- **Message contract:** every message has a `type` + versioned payload schema; client validates. List them in the Spec.
- **Reconnection:** client resumes; server tolerates gaps. For SSE use `Last-Event-ID`; for WS use a resume token or re-sync on connect.
- **Backpressure:** bound per-connection buffers; drop/coalesce when slow; never let one client OOM the server.
- **Fan-out** via the event layer (pub/sub) so multiple server instances can push — don't hold state in one process. See the `event` skill.

## Testing (no browser e2e)

- **Contract test** each message `type` + payload schema.
- **Unit test** authz (subscribe to a forbidden topic is rejected) and reconnection/resume logic.
- **Integration test** publish → socket delivers to subscribed client, not to others.

## Output

```txt
Real-time design — <feature>

Transport: SSE | WebSocket | polling-on-render (reason)
Auth: handshake + per-topic authz
Topics: <pattern> (resource-scoped)
Messages: | type | payload schema (versioned) |
Reconnect: <Last-Event-ID | resume token | re-sync>
Fan-out: <pub/sub via event layer>
Tests: contract (messages) + unit (authz/reconnect) + integration (delivery)
```

## Anti-patterns

- A WebSocket where SSE (or polling) suffices.
- Trusting client-supplied topic names without authz.
- In-process subscriber state that breaks with >1 server instance.
- Unbounded send buffers (no backpressure).
- Browser e2e to verify message delivery.
