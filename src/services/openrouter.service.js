const config = require('../config/env.config');
const { TELEGRAM_INLINE_MAX_CHARS, TELEGRAM_MAX_MESSAGE } = require('../constants/limits');
const { escapeHtml } = require('../utils/html');
const {
  extractPrompt,
  extractResponse,
  formatContentBlock,
  toPayloadObject,
  isOversizedForTelegram,
} = require('../utils/openrouter-content');
const { iterateSpans, spanAttributesToMap } = require('../utils/otlp');
const tracePayloadsStorage = require('../storage/trace-payloads.storage');
const telegramService = require('./telegram.service');

function formatSpanSummary(attrs, durationMs) {
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

  const costLabel =
    typeof cost === 'number' ? `$${cost}` : `$${escapeHtml(cost)}`;

  return {
    model,
    user,
    promptTokens,
    completionTokens,
    costLabel,
    lines: [
      '🤖 <b>OpenRouter Trace</b>',
      `├ Model: <code>${escapeHtml(model)}</code>`,
      `├ User: <code>${escapeHtml(user)}</code>`,
      `├ Tokens: ${escapeHtml(promptTokens)} in / ${escapeHtml(completionTokens)} out`,
      `├ Cost: ${costLabel}`,
      `└ Latency: ${durationMs.toFixed(0)}ms`,
    ],
  };
}

async function formatSpanMessage(span) {
  const attrs = spanAttributesToMap(span.attributes);
  const startNs = Number(span.startTimeUnixNano || 0);
  const endNs = Number(span.endTimeUnixNano || 0);
  const durationMs = startNs && endNs ? (endNs - startNs) / 1_000_000 : 0;

  const summary = formatSpanSummary(attrs, durationMs);
  const lines = [...summary.lines];

  if (!config.openrouter.includeContent) {
    return lines.join('\n');
  }

  const requestObj = toPayloadObject(extractPrompt(attrs));
  const responseObj = toPayloadObject(extractResponse(attrs));

  if (
    isOversizedForTelegram(requestObj, responseObj, TELEGRAM_INLINE_MAX_CHARS)
  ) {
    const saved = await tracePayloadsStorage.saveTracePayload({
      traceId: span.traceId,
      spanId: span.spanId,
      model: summary.model,
      user: summary.user,
      request: requestObj,
      response: responseObj,
      meta: { storedReason: 'oversized_for_telegram' },
    });

    const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
    lines.push(
      '',
      '📁 <b>Payload lớn</b> — lưu MongoDB',
      `├ Collection: <code>${tracePayloadsStorage.COLLECTION}</code>`,
      `├ _id: <code>${escapeHtml(saved.id)}</code>`,
      `├ request.json: ${kb(saved.requestBytes)}`,
      `└ response.json: ${kb(saved.responseBytes)}`,
      '',
      '<i>Atlas: db.trace_payloads.find({ _id: ObjectId("…") })</i>',
    );
  } else {
    const budget = TELEGRAM_INLINE_MAX_CHARS;
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
  if (text.length > TELEGRAM_MAX_MESSAGE) {
    text = `${text.slice(0, TELEGRAM_MAX_MESSAGE - 20)}\n… (truncated)`;
  }

  return text;
}

function countSpans(body) {
  return [...iterateSpans(body)].length;
}

async function processTracePayload(body) {
  const messages = [];
  let storedPayloads = 0;

  for (const span of iterateSpans(body)) {
    messages.push(await formatSpanMessage(span));
  }

  for (const message of messages) {
    await telegramService.sendToFeature('openrouter', message);
    if (message.includes('trace_payloads')) {
      storedPayloads += 1;
    }
  }

  return {
    spansProcessed: messages.length,
    spanCount: countSpans(body),
    storedPayloads,
    topLevelKeys: Object.keys(body || {}),
    includeContent: config.openrouter.includeContent,
  };
}

module.exports = {
  processTracePayload,
  formatSpanMessage,
};
