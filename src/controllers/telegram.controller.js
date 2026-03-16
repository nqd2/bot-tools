const telegramService = require('../services/telegram.service');

async function handleTelegramWebhook(req, res) {
  try {
    if (req.method === 'POST') {
      await telegramService.processUpdate(req.body);
      return res.status(200).send('OK');
    }

    return res.status(200).send('Bot is running...');
  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(500).send('Error');
  }
}

module.exports = {
  handleTelegramWebhook,
};

