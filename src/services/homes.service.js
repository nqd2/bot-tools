const { FEATURES, isValidFeature } = require('../config/features');
const homesStorage = require('../storage/homes.storage');

async function setHome(feature, { chatId, topicId, title }) {
  const all = await homesStorage.readAll();
  all[feature] = {
    chatId,
    topicId: topicId ?? null,
    title: title ?? null,
    updatedAt: new Date().toISOString(),
  };
  await homesStorage.writeAll(all);
  return all[feature];
}

async function getHome(feature) {
  const all = await homesStorage.readAll();
  return all[feature] || null;
}

async function listHomes() {
  return homesStorage.readAll();
}

async function clearHome(feature) {
  const all = await homesStorage.readAll();
  delete all[feature];
  await homesStorage.writeAll(all);
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
    `<code>/sethome list</code> — this list`,
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
