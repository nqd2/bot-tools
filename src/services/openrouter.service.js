const config = require('../config/env.config');
const { escapeHtml } = require('../utils/html');
const {
  extractPrompt,
  extractResponse,
  formatContentBlock,
} = require('../utils/openrouter-content');
const { iterateSpans, spanAttributesToMap } = require('../utils/otlp');
const telegramService = require('./telegram.service');

const TELEGRAM_MAX = 4096;
const CONTENT_RESERVE = 900;

function formatSpanMessage(span) {
  const attrs = spanAttributesToMap(span.attributes);
  const model = attrs['gen_ai.request.model'] ?? attrs['gen_ai.response.model'] ?? 'unknown';
  const promptTokens =
    attrs['gen_ai.usage.input_tokens']
    ?? attrs['gen_ai.usage.prompt_tokens']
    ?? '?';
  const completionTokens =
    attrs['gen_ai.usage.output_tokens']
    ?? attrs['gen_ai.usage.completion_tokens']
    ?? '?';
  const cost = attrs['gen_ai.usage.cost'] ?? '?';
  const user = attrs['user.id'] ?? attrs.user ?? 'anonymous';

  const startNs = Number(span.startTimeUnixNano || 0);
  const endNs = Number(span.endTimeUnixNano || 0);
  const durationMs = startNs && endNs ? (endNs - startNs) / 1_000_000 : 0;

  const costLabel =
    typeof cost === 'number' ? `$${cost}` : `$${escapeHtml(cost)}`;

  const lines = [
    '🤖 <b>OpenRouter Trace</b>',
    `├ Model: <code>${escapeHtml(model)}</code>`,
    `├ User: <code>${escapeHtml(user)}</code>`,
    `├ Tokens: ${escapeHtml(promptTokens)} in / ${escapeHtml(completionTokens)} out`,
    `├ Cost: ${costLabel}`,
    `└ Latency: ${durationMs.toFixed(0)}ms`,
  ];

  if (config.openrouter.includeContent) {
    const maxChars = config.openrouter.maxContentChars;
    const headerLen = lines.join('\n').length;
    const budget = Math.max(
      400,
      Math.min(maxChars, TELEGRAM_MAX - headerLen - CONTENT_RESERVE),
    );

    const promptBlock = formatContentBlock('📥 Prompt', extractPrompt(attrs), budget);
    const responseBlock = formatContentBlock(
      '📤 Response',
      extractResponse(attrs),
      budget,
    );

    if (promptBlock) {
      lines.push('', promptBlock);
    }
    if (responseBlock) {
      lines.push('', responseBlock);
    }
    if (!promptBlock && !responseBlock) {
      lines.push(
        '',
        '<i>No prompt/response in trace (Privacy Mode hoặc span không chứa content).</i>',
      );
    }
  }

  let text = lines.join('\n');
  if (text.length > TELEGRAM_MAX) {
    text = `${text.slice(0, TELEGRAM_MAX - 20)}\n… (truncated)`;
  }

  return text;
}

function countSpans(body) {
  return [...iterateSpans(body)].length;
}

async function processTracePayload(body) {
  const messages = [];

  for (const span of iterateSpans(body)) {
    messages.push(formatSpanMessage(span));
  }

  for (const message of messages) {
    await telegramService.sendToFeature('openrouter', message);
  }

  return {
    spansProcessed: messages.length,
    spanCount: countSpans(body),
    topLevelKeys: Object.keys(body || {}),
    includeContent: config.openrouter.includeContent,
  };
}

module.exports = {
  processTracePayload,
  formatSpanMessage,
};
