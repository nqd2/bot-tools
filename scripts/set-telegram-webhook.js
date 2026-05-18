#!/usr/bin/env node
require('dotenv').config();
const { setTelegramWebhook } = require('../src/setup-webhook');

const baseUrl = process.env.WEBHOOK_BASE_URL || process.env.VERCEL_URL;

if (!baseUrl) {
  console.error(
    'Set WEBHOOK_BASE_URL in .env, e.g. WEBHOOK_BASE_URL=https://bot-tools-ebon.vercel.app',
  );
  process.exit(1);
}

const normalized = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;

setTelegramWebhook(normalized).then((ok) => {
  process.exit(ok ? 0 : 1);
});
