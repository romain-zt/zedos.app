-- Migration: 20260510000001_add_webhook_idempotency_and_correlation_id
-- Adds webhook idempotency table and correlation_id for ledger idempotency.

-- 1. Add ProcessedWebhookEvent table for Stripe webhook idempotency.
CREATE TABLE "processed_webhook_events" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "processed_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "processed_webhook_events_event_id_key" ON "processed_webhook_events"("event_id");
CREATE INDEX "processed_webhook_events_processed_at_idx" ON "processed_webhook_events"("processed_at");

-- 2. Add nullable correlation_id to credit_transactions for ledger idempotency.
ALTER TABLE "credit_transactions" ADD COLUMN "correlation_id" TEXT;

-- 3. Unique partial index — existing NULL rows are unconstrained; new rows must be unique per (user_id, correlation_id).
CREATE UNIQUE INDEX "credit_transactions_user_correlation_idx"
    ON "credit_transactions"("user_id", "correlation_id")
    WHERE "correlation_id" IS NOT NULL;
