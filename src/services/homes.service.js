const { FEATURES, isValidFeature } = require('../config/features');
const homesStorage = require('../storage/homes.storage');
const logsService = require('./logs.service');

async function setHome(feature, { chatId, topicId, title }, context = {}) {
  const home = await homesStorage.upsertHome(feature, { chatId, topicId, title });

  logsService.writeLog({
    level: 'info',
    source: 'telegram',
    event: 'sethome',
    message: `Set home for ${feature}`,
    meta: { feature, home },
    userId: context.userId ?? null,
    chatId: context.chatId ?? chatId,
  });

  return home;
}

async function getHome(feature) {
  return homesStorage.getHome(feature);
}

async function listHomes() {
  return homesStorage.getAllHomes();
}

async function clearHome(feature, context = {}) {
  await homesStorage.deleteHome(feature);

  logsService.writeLog({
    level: 'info',
    source: 'telegram',
    event: 'sethome_clear',
    message: `Cleared home for ${feature}`,
    meta: { feature },
    userId: context.userId ?? null,
    chatId: context.chatId ?? null,
  });
}

function formatHomesList(homes) {
  const lines = ['<b>Configured homes</b>', ''];

  for (const key of Object.keys(FEATURES)) {
    const home = homes[key];
    if (!home) {
      lines.push(`• <code>${key}</code> — <i>not set</i>`);
      continue;
    }

    const topic = home.topicId ? home.topicId : '(main)';
    const label = home.title ? ` (${home.title})` : '';
    lines.push(
      `• <code>${key}</code>${label}`,
      `  chat: <code>${home.chatId}</code>, topic: <code>${topic}</code>`,
    );
  }

  lines.push(
    '',
    '<b>Usage</b>',
    '<code>/sethome &lt;feature&gt;</code> — set in current chat/topic',
    '<code>/sethome clear &lt;feature&gt;</code> — remove',
    '<code>/sethome list</code> — this list',
    '',
    `Features: ${Object.keys(FEATURES).join(', ')}`,
  );

  return lines.join('\n');
}

module.exports = {
  setHome,
  getHome,
  listHomes,
  clearHome,
  isValidFeature,
  formatHomesList,
};
