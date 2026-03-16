const { handleDiscordWebhook } = require('../controllers/discord.controller');

module.exports = async (req, res) => {
  await handleDiscordWebhook(req, res);
};

