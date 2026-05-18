const express = require('express');
const { handleTelegramWebhook } = require('./controllers/telegram.controller');
const { handleDiscordWebhook } = require('./controllers/discord.controller');
const { handleOpenRouterWebhook } = require('./controllers/openrouter.controller');

const app = express();

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    name: 'bot-tools',
    status: 'ok',
    storage: 'mongodb',
    endpoints: {
      telegram: '/api/telegram',
      discord: '/api/discord',
      openrouter: '/api/openrouter',
    },
    commands: {
      start: 'Help / command list',
      getid: 'Chat ID, User ID, Topic ID',
      sethome: 'Set notification target (e.g. /sethome openrouter)',
    },
  });
});

app.all(['/telegram', '/api/telegram'], handleTelegramWebhook);
app.post(['/discord', '/api/discord'], handleDiscordWebhook);
app.post(['/webhook', '/api/openrouter'], handleOpenRouterWebhook);

module.exports = app;

