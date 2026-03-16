const app = require('./app');
const config = require('./config/env.config');

app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
});

