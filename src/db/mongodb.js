const { MongoClient } = require('mongodb');
const config = require('../config/env.config');

const globalKey = '_botToolsMongo';

async function getClient() {
  const uri = config.mongodb.uri;
  if (!uri) {
    throw new Error('MONGODB_URI is not configured');
  }

  if (!global[globalKey]) {
    const client = new MongoClient(uri);
    global[globalKey] = {
      client,
      promise: client.connect(),
    };
  }

  await global[globalKey].promise;
  return global[globalKey].client;
}

async function getDb() {
  const client = await getClient();
  return client.db(config.mongodb.dbName);
}

async function ensureIndexes() {
  const db = await getDb();

  await db.collection('homes').createIndex({ feature: 1 }, { unique: true });
  await db.collection('logs').createIndex({ createdAt: -1 });
  await db.collection('logs').createIndex({ source: 1, event: 1, createdAt: -1 });
}

let indexesReady = false;

async function getDbReady() {
  const db = await getDb();
  if (!indexesReady) {
    await ensureIndexes();
    indexesReady = true;
  }
  return db;
}

module.exports = {
  getClient,
  getDb,
  getDbReady,
};
