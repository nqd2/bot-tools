const dotenv = require('dotenv');
dotenv.config();

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  telegram: {
    botToken: process.env.BOT_TOKEN || '',
    adminIds: (process.env.BOT_ADMIN_IDS || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean),
  },
  mongodb: {
    uri: process.env.MONGODB_URI || '',
    dbName: process.env.MONGODB_DB_NAME || 'bot_tools',
  },
  openrouter: {
    webhookSecret: process.env.OPENROUTER_WEBHOOK_SECRET || '',
    includeContent: process.env.OPENROUTER_INCLUDE_CONTENT !== 'false',
  },
  discord: {
    token: process.env.DISCORD_TOKEN || '',
    applicationId: process.env.DISCORD_APPLICATION_ID || '',
    publicKey: process.env.DISCORD_PUBLIC_KEY || '',
  },
};

module.exports = config;

