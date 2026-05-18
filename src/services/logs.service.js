const { getDbReady } = require('../db/mongodb');

const COLLECTION = 'logs';

function writeLog(payload) {
  setImmediate(() => {
    writeLogAsync(payload).catch((error) => {
      console.error('Failed to write log:', error.message);
    });
  });
}

async function writeLogAsync({
  level = 'info',
  source,
  event,
  message = '',
  meta = null,
  userId = null,
  chatId = null,
}) {
  const db = await getDbReady();
  await db.collection(COLLECTION).insertOne({
    level,
    source,
    event,
    message,
    meta,
    userId,
    chatId,
    createdAt: new Date(),
  });
}

module.exports = {
  writeLog,
};
