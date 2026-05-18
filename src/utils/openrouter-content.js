const { escapeHtml } = require('./html');

const PROMPT_KEYS = [
  'gen_ai.prompt',
  'gen_ai.request.content',
  'gen_ai.input.messages',
  'gen_ai.request.messages',
];

const RESPONSE_KEYS = [
  'gen_ai.completion',
  'gen_ai.response.content',
  'gen_ai.output.messages',
  'gen_ai.response.messages',
  'gen_ai.response.text',
];

function tryParseJson(value) {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) {
    return value;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function formatMessages(value) {
  const parsed = tryParseJson(value);

  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return String(item);
        }
        const role = item.role || item.type || 'message';
        const content =
          item.content
          ?? item.text
          ?? item.message
          ?? JSON.stringify(item);
        return `${role}: ${content}`;
      })
      .join('\n');
  }

  if (parsed && typeof parsed === 'object') {
    return JSON.stringify(parsed, null, 2);
  }

  return String(parsed);
}

function pickFromAttrs(attrs, keys) {
  for (const key of keys) {
    if (attrs[key] !== undefined && attrs[key] !== null && attrs[key] !== '') {
      return { key, value: attrs[key] };
    }
  }
  return null;
}

function pickByPattern(attrs, pattern) {
  for (const [key, value] of Object.entries(attrs)) {
    if (pattern.test(key) && value !== undefined && value !== null && value !== '') {
      return { key, value };
    }
  }
  return null;
}

function extractPrompt(attrs) {
  return (
    pickFromAttrs(attrs, PROMPT_KEYS)
    ?? pickByPattern(attrs, /(prompt|input).*message|request.*content/i)
  );
}

function extractResponse(attrs) {
  return (
    pickFromAttrs(attrs, RESPONSE_KEYS)
    ?? pickByPattern(attrs, /(completion|output|response).*(content|message|text)/i)
  );
}

function truncate(text, maxChars) {
  const str = String(text);
  if (str.length <= maxChars) {
    return str;
  }
  return `${str.slice(0, maxChars - 20)}\n… (${str.length} chars total)`;
}

function formatContentBlock(label, picked, maxChars) {
  if (!picked) {
    return null;
  }

  const body = formatMessages(picked.value);
  const truncated = truncate(body, maxChars);

  return [
    `<b>${label}</b> <i>(${escapeHtml(picked.key)})</i>`,
    `<pre>${escapeHtml(truncated)}</pre>`,
  ].join('\n');
}

module.exports = {
  extractPrompt,
  extractResponse,
  formatContentBlock,
  formatMessages,
  truncate,
};
