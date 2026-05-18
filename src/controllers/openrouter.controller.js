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

async function handleOpenRouterWebhook(req, res) {
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

  try {
    const result = await openrouterService.processTracePayload(req.body);
    logsService.writeLog({
      level: 'info',
      source: 'openrouter',
      event: 'trace_received',
      message: `Processed ${result.spansProcessed} span(s)`,
      meta: result,
    });
    return res.json({ status: 'received', ...result });
  } catch (error) {
    console.error('OpenRouter webhook error:', error);
    logsService.writeLog({
      level: 'error',
      source: 'openrouter',
      event: 'process_error',
      message: error.message,
      meta: { stack: error.stack },
    });
    return res.status(500).json({ error: 'Failed to process trace' });
  }
}

module.exports = {
  handleOpenRouterWebhook,
};
