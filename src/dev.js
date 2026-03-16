const { exec } = require('child_process');
const http = require('http');
const { setTelegramWebhook } = require('./setup-webhook');
const app = require('./app');
const config = require('./config/env.config');

const port = config.port;

function getNgrokUrl() {
  return new Promise((resolve) => {
    const options = { host: '127.0.0.1', port: 4040, path: '/api/tunnels' };
    let attempts = 0;

    const interval = setInterval(() => {
      http
        .get(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              const publicUrl =
                json.tunnels && json.tunnels[0] && json.tunnels[0].public_url;
              if (publicUrl) {
                clearInterval(interval);
                resolve(publicUrl);
              }
            } catch {
              // waiting for ngrok to be ready
            }
          });
        })
        .on('error', () => {
          // ngrok API not ready yet
        });

      attempts += 1;
      if (attempts > 10) {
        clearInterval(interval);
        resolve(null);
      }
    }, 1000);
  });
}

function startNgrokCli() {
  return new Promise((resolve, reject) => {
    const cmd = process.platform === 'win32' ? 'ngrok.exe' : 'ngrok';

    // Check if ngrok CLI exists
    exec(`${cmd} version`, (err) => {
      if (err) {
        return reject(new Error('ngrok CLI not found'));
      }

      const httpCmd = `${cmd} http ${port} --log=stdout`;
      exec(httpCmd);

      getNgrokUrl().then((url) => {
        if (url) {
          resolve(url);
        } else {
          reject(new Error('Could not get ngrok URL from local API'));
        }
      });
    });
  });
}

async function start() {
  const server = app.listen(port, async () => {
    try {
      console.log('Server listening on:');
      console.log(`- Local:   http://localhost:${port}`);

      const url = await startNgrokCli();
      console.log(`- Ngrok:   ${url}`);
      setTelegramWebhook(url);
    } catch (error) {
      console.error('Failed to start ngrok tunnel automatically:', error.message);
      console.log('You can start it manually with: ngrok http 3000');
    }
  });

  const shutdown = async () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();

