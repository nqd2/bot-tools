const { handleTelegramWebhook } = require('../controllers/telegram.controller');

module.exports = async (req, res) => {
  await handleTelegramWebhook(req, res);
};

