const { escapeHtml } = require('../utils/html');
const { iterateSpans, spanAttributesToMap } = require('../utils/otlp');
const telegramService = require('./telegram.service');

function formatSpanMessage(span) {
  const attrs = spanAttributesToMap(span.attributes);
  const model = attrs['gen_ai.request.model'] ?? 'unknown';
  const promptTokens = attrs['gen_ai.usage.input_tokens'] ?? '?';
  const completionTokens = attrs['gen_ai.usage.output_tokens'] ?? '?';
  const cost = attrs['gen_ai.usage.cost'] ?? '?';
  const user = attrs.user ?? 'anonymous';

  const startNs = Number(span.startTimeUnixNano || 0);
  const endNs = Number(span.endTimeUnixNano || 0);
  const durationMs = startNs && endNs ? (endNs - startNs) / 1_000_000 : 0;

  const costLabel =
    typeof cost === 'number' ? `$${cost}` : `$${escapeHtml(cost)}`;

  return [
    '🤖 <b>OpenRouter Trace</b>',
    `├ Model: <code>${escapeHtml(model)}</code>`,
    `├ User: <code>${escapeHtml(user)}</code>`,
    `├ Tokens: ${escapeHtml(promptTokens)} in / ${escapeHtml(completionTokens)} out`,
    `├ Cost: ${costLabel}`,
    `└ Latency: ${durationMs.toFixed(0)}ms`,
  ].join('\n');
}

async function processTracePayload(body) {
  const messages = [];

  for (const span of iterateSpans(body)) {
    messages.push(formatSpanMessage(span));
  }

  for (const message of messages) {
    await telegramService.sendToFeature('openrouter', message);
  }

  return { spansProcessed: messages.length };
}

module.exports = {
  processTracePayload,
  formatSpanMessage,
};
