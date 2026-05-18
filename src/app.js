const express = require('express');
const { handleTelegramWebhook } = require('./controllers/telegram.controller');
const { handleDiscordWebhook } = require('./controllers/discord.controller');

const app = express();

app.use(express.json());

app.all(['/telegram', '/api/telegram'], handleTelegramWebhook);
app.post(['/discord', '/api/discord'], handleDiscordWebhook);

module.exports = app;

