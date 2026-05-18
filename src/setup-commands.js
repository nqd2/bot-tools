const https = require('https');
const { URL } = require('url');
const config = require('./config/env.config');

const COMMANDS = [
  { command: 'start', description: 'Hướng dẫn sử dụng bot' },
  { command: 'getid', description: 'Xem Chat ID / User ID' },
  { command: 'sethome', description: 'Chọn nơi nhận thông báo' },
];

function setTelegramCommands() {
  const token = config.telegram.botToken;
  if (!token) {
    console.warn('BOT_TOKEN is not set. Skipping setMyCommands.');
    return Promise.resolve(false);
  }

  const url = new URL(`/bot${token}/setMyCommands`, 'https://api.telegram.org');
  const body = JSON.stringify({ commands: COMMANDS });

  return new Promise((resolve) => {
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.ok) {
              console.log('Telegram commands registered:', COMMANDS.map((c) => `/${c.command}`).join(', '));
              resolve(true);
            } else {
              console.error('setMyCommands failed:', json);
              resolve(false);
            }
          } catch (error) {
            console.error('setMyCommands parse error:', error);
            resolve(false);
          }
        });
      },
    );

    req.on('error', (error) => {
      console.error('setMyCommands request error:', error);
      resolve(false);
    });

    req.write(body);
    req.end();
  });
}

module.exports = {
  setTelegramCommands,
  COMMANDS,
};
