/**
 * Context engine: fixes double context growth.
 *
 * Agents are resumed across turns (the SDK keeps their own transcript), so
 * prompts must NOT re-inject the full thread. Instead each agent receives:
 *   1. a rolling summary of older conversation (maintained per session)
 *   2. only the messages it has not seen yet (delta since last_seen_ts),
 *      capped at the verbatim window
 *
 * The last `windowSize` (~30) messages of a session stay verbatim; anything
 * older is folded into the rolling summary.
 */

/** @typedef {{ id: string; author: string; text: string; ts: number }} Msg */

/**
 * @param {{ windowSize?: number }} [opts]
 */
export function createContextEngine(opts = {}) {
  const windowSize = opts.windowSize ?? 30;
  /** Fold old messages into the summary once this many pile up unsummarized. */
  const summarizeBatchMin = 10;

  /**
   * Messages an agent should see this turn: everything after its
   * last_seen_ts, capped at `windowSize` most recent entries.
   * @param {Msg[]} messages ordered ascending by ts
   * @param {number} lastSeenTs
   * @returns {{ delta: Msg[]; skipped: number }}
   */
  function deltaFor(messages, lastSeenTs) {
    const unseen = messages.filter((m) => m.ts > lastSeenTs);
    if (unseen.length <= windowSize) return { delta: unseen, skipped: 0 };
    return {
      delta: unseen.slice(-windowSize),
      skipped: unseen.length - windowSize,
    };
  }

  /**
   * Old messages that should be folded into the rolling summary: everything
   * outside the verbatim window that is newer than summarized_until.
   * @param {Msg[]} messages
   * @param {number} summarizedUntil
   */
  function pendingSummaryBatch(messages, summarizedUntil) {
    const cutoff = messages.length - windowSize;
    if (cutoff <= 0) return [];
    const old = messages.slice(0, cutoff).filter((m) => m.ts > summarizedUntil);
    return old.length >= summarizeBatchMin ? old : [];
  }

  /**
   * Maintain the session rolling summary. `summarizeFn` receives the prior
   * summary and the batch text and returns the new summary; on failure the
   * old summary is kept and the batch stays pending.
   * @param {{ rolling_summary: string; summarized_until: number }} session
   * @param {Msg[]} messages
   * @param {(priorSummary: string, batchText: string) => Promise<string>} summarizeFn
   * @param {(authorId: string) => string} nameOf
   * @returns {Promise<{ rollingSummary: string; summarizedUntil: number } | null>} null when nothing to do
   */
  async function updateRollingSummary(session, messages, summarizeFn, nameOf) {
    const batch = pendingSummaryBatch(messages, session.summarized_until);
    if (batch.length === 0) return null;
    const batchText = batch.map((m) => `${nameOf(m.author)}: ${m.text}`).join("\n");
    try {
      const next = await summarizeFn(session.rolling_summary, batchText);
      if (!next?.trim()) return null;
      return {
        rollingSummary: next.trim(),
        summarizedUntil: batch[batch.length - 1].ts,
      };
    } catch (err) {
      console.warn(`rolling summary update failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Render the dynamic context block for a prompt tail.
   * @param {{ rollingSummary: string; delta: Msg[]; skipped: number }} parts
   * @param {(authorId: string) => string} nameOf
   */
  function renderContextBlock({ rollingSummary, delta, skipped }, nameOf) {
    const sections = [];
    if (rollingSummary) {
      sections.push(`EARLIER CONTEXT (summary of older discussion):\n${rollingSummary}`);
    }
    if (skipped > 0) {
      sections.push(`(${skipped} intermediate messages omitted — covered by the summary above)`);
    }
    if (delta.length > 0) {
      const lines = delta.map((m) => `${nameOf(m.author)}: ${m.text}`).join("\n");
      sections.push(`NEW MESSAGES SINCE YOUR LAST TURN:\n${lines}`);
    } else {
      sections.push("NEW MESSAGES SINCE YOUR LAST TURN:\n(none — you are opening this step)");
    }
    return sections.join("\n\n");
  }

  return { windowSize, deltaFor, pendingSummaryBatch, updateRollingSummary, renderContextBlock };
}
