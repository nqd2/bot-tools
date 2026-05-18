const { getDbReady } = require('../db/mongodb');

const COLLECTION = 'logs';

async function writeLog({
  level = 'info',
  source,
  event,
  message = '',
  meta = null,
  userId = null,
  chatId = null,
}) {
  try {
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
  } catch (error) {
    console.error('Failed to write log:', error.message);
  }
}

module.exports = {
  writeLog,
};
