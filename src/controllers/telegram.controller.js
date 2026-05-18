const telegramService = require('../services/telegram.service');
const logsService = require('../services/logs.service');

async function handleTelegramWebhook(req, res) {
  try {
    if (req.method === 'POST') {
      const update = req.body;
      const text = update?.message?.text;
      if (text?.startsWith('/')) {
        await logsService.writeLog({
          level: 'debug',
          source: 'telegram',
          event: 'webhook_command',
          message: text,
          meta: { updateId: update?.update_id },
          chatId: update?.message?.chat?.id ?? null,
          userId: update?.message?.from?.id ?? null,
        });
      }
      await telegramService.processUpdate(update);
      return res.status(200).send('OK');
    }

    return res.status(200).send('Bot is running...');
  } catch (error) {
    console.error('Webhook Error:', error);
    await logsService.writeLog({
      level: 'error',
      source: 'telegram',
      event: 'webhook_error',
      message: error.message,
      meta: { stack: error.stack },
    });
    return res.status(500).send('Error');
  }
}

module.exports = {
  handleTelegramWebhook,
};
