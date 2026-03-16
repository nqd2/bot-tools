const https = require('https');
const { URL } = require('url');
const config = require('./config/env.config');

function setTelegramWebhook(baseUrl) {
  const token = config.telegram.botToken;
  if (!token) {
    console.warn('telegram.botToken is not set. Skipping Telegram setWebhook.');
    return;
  }

  const url = new URL(
    `/bot${token}/setWebhook`,
    'https://api.telegram.org',
  );
  url.searchParams.set('url', `${baseUrl}/telegram`);

  https.get(url.toString(), (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.ok) {
          console.log('Telegram webhook set successfully:', url, JSON.stringify(json.result, null, 5));
        } else {
          console.error('Failed to set Telegram webhook:', url, json);
        }
      } catch (error) {
        console.error('Error parsing Telegram setWebhook response:', error);
      }
    });
  }).on('error', (error) => {
    console.error('Error calling Telegram setWebhook:', error);
  });
}

module.exports = {
  setTelegramWebhook,
};

