const { MongoClient } = require('mongodb');
const config = require('../config/env.config');

const globalKey = '_botToolsMongo';

function getClientOptions() {
  return {
    maxPoolSize: 10,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 10000,
  };
}

async function getClient() {
  const uri = config.mongodb.uri;
  if (!uri) {
    throw new Error('MONGODB_URI is not configured');
  }

  if (uri.includes('<') || uri.includes('>')) {
    throw new Error(
      'MONGODB_URI chứa <password> placeholder — thay bằng mật khẩu thật (URL-encoded).',
    );
  }

  if (!global[globalKey]) {
    const client = new MongoClient(uri, getClientOptions());
    global[globalKey] = {
      client,
      promise: client.connect().catch((error) => {
        global[globalKey] = null;
        throw error;
      }),
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
  await db.collection('trace_payloads').createIndex({ createdAt: -1 });
  await db.collection('trace_payloads').createIndex({ traceId: 1 });
}

let indexesReady = false;

async function getDbReady() {
  const db = await getDb();
  if (!indexesReady) {
    indexesReady = true;
    ensureIndexes().catch((error) => {
      console.warn('MongoDB index setup failed:', error.message);
      indexesReady = false;
    });
  }
  return db;
}

module.exports = {
  getClient,
  getDb,
  getDbReady,
};
