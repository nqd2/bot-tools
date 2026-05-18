const config = require('../config/env.config');
const openrouterService = require('../services/openrouter.service');
const homesService = require('../services/homes.service');
const logsService = require('../services/logs.service');

function isAuthorized(req) {
  const secret = config.openrouter.webhookSecret;
  if (!secret) {
    return true;
  }

  const headerSecret =
    req.headers['x-secret'] ||
    req.headers['x-webhook-secret'] ||
    req.headers.authorization;

  if (headerSecret === secret) {
    return true;
  }

  if (typeof headerSecret === 'string' && headerSecret.startsWith('Bearer ')) {
    return headerSecret.slice(7) === secret;
  }

  return false;
}

function spanCount(body) {
  const spans = body?.resourceSpans || [];
  let count = 0;
  for (const rs of spans) {
    for (const ss of rs?.scopeSpans || []) {
      count += (ss?.spans || []).length;
    }
  }
  return count;
}

async function processTraceAsync(body, meta) {
  try {
    const result = await openrouterService.processTracePayload(body);
    logsService.writeLog({
      level: result.spansProcessed > 0 ? 'info' : 'warn',
      source: 'openrouter',
      event: result.spansProcessed > 0 ? 'trace_received' : 'trace_empty',
      message: result.spansProcessed > 0
        ? `Sent ${result.spansProcessed} Telegram notification(s)`
        : 'Webhook received but no spans parsed',
      meta: { ...meta, ...result },
    });
  } catch (error) {
    console.error('OpenRouter async process error:', error);
    logsService.writeLog({
      level: 'error',
      source: 'openrouter',
      event: 'process_error',
      message: error.message,
      meta: { ...meta, stack: error.stack },
    });
  }
}

async function handleOpenRouterWebhook(req, res) {
  const contentLength = req.headers['content-length'];
  const spans = spanCount(req.body);
  const bodyKeys = req.body && typeof req.body === 'object'
    ? Object.keys(req.body)
    : [];

  logsService.writeLog({
    level: 'debug',
    source: 'openrouter',
    event: 'webhook_hit',
    message: 'OpenRouter webhook request',
    meta: {
      contentLength,
      spanCount: spans,
      testConnection: req.headers['x-test-connection'] === 'true',
      bodyKeys,
      hasResourceSpans: Boolean(req.body?.resourceSpans?.length),
    },
  });

  if (req.headers['x-test-connection'] === 'true') {
    logsService.writeLog({
      level: 'info',
      source: 'openrouter',
      event: 'test_connection',
      message: 'OpenRouter test connection',
    });
    return res.json({ status: 'ok' });
  }

  if (!isAuthorized(req)) {
    logsService.writeLog({
      level: 'warn',
      source: 'openrouter',
      event: 'unauthorized',
      message: 'Invalid webhook secret',
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!config.telegram.botToken) {
    return res.status(503).json({ error: 'BOT_TOKEN must be configured' });
  }

  const openrouterHome = await homesService.getHome('openrouter');
  if (!openrouterHome) {
    logsService.writeLog({
      level: 'warn',
      source: 'openrouter',
      event: 'no_home',
      message: 'openrouter home not configured',
    });
    return res.status(503).json({
      error: 'No home for openrouter. Run /sethome openrouter in the target Telegram chat.',
    });
  }

  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const meta = { contentLength, spanCount: spans };

  // Trả 200 ngay (Cursor trace rất lớn — xử lý nền tránh timeout)
  res.json({ status: 'accepted', spanCount: spans });

  setImmediate(() => {
    processTraceAsync(req.body, meta);
  });
}

module.exports = {
  handleOpenRouterWebhook,
};
