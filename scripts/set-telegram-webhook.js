#!/usr/bin/env node
require('dotenv').config();
const { setTelegramWebhook } = require('../src/setup-webhook');
const { setTelegramCommands } = require('../src/setup-commands');

const baseUrl = process.env.WEBHOOK_BASE_URL || process.env.VERCEL_URL;

if (!baseUrl) {
  console.error(
    'Set WEBHOOK_BASE_URL in .env, e.g. WEBHOOK_BASE_URL=https://bot-tools-ebon.vercel.app',
  );
  process.exit(1);
}

const normalized = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;

Promise.all([
  setTelegramWebhook(normalized),
  setTelegramCommands(),
]).then(([webhookOk, commandsOk]) => {
  process.exit(webhookOk && commandsOk ? 0 : 1);
});
