const https = require('https');
const { URL } = require('url');
const config = require('./config/env.config');

function setTelegramWebhook(baseUrl) {
  const token = config.telegram.botToken;
  if (!token) {
    console.warn('telegram.botToken is not set. Skipping Telegram setWebhook.');
    return Promise.resolve(false);
  }

  const apiUrl = new URL(
    `/bot${token}/setWebhook`,
    'https://api.telegram.org',
  );
  const webhookPath = process.env.WEBHOOK_PATH || '/api/telegram';
  const webhookUrl = `${baseUrl.replace(/\/$/, '')}${webhookPath}`;
  apiUrl.searchParams.set('url', webhookUrl);

  return new Promise((resolve) => {
    https.get(apiUrl.toString(), (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.ok) {
            console.log('Telegram webhook set:', webhookUrl);
            console.log(JSON.stringify(json.result, null, 2));
            resolve(true);
          } else {
            console.error('Failed to set Telegram webhook:', json);
            resolve(false);
          }
        } catch (error) {
          console.error('Error parsing Telegram setWebhook response:', error);
          resolve(false);
        }
      });
    }).on('error', (error) => {
      console.error('Error calling Telegram setWebhook:', error);
      resolve(false);
    });
  });
}

module.exports = {
  setTelegramWebhook,
};

