const dotenv = require('dotenv');
dotenv.config();

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  telegram: {
    botToken: process.env.BOT_TOKEN || '',
  },
  discord: {
    token: process.env.DISCORD_TOKEN || '',
    applicationId: process.env.DISCORD_APPLICATION_ID || '',
    publicKey: process.env.DISCORD_PUBLIC_KEY || '',
  },
};

module.exports = config;

