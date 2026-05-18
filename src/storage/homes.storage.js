const { getDbReady } = require('../db/mongodb');

const COLLECTION = 'homes';

async function upsertHome(feature, data) {
  const db = await getDbReady();
  const doc = {
    feature,
    chatId: data.chatId,
    topicId: data.topicId ?? null,
    title: data.title ?? null,
    updatedAt: new Date(),
  };

  await db.collection(COLLECTION).updateOne(
    { feature },
    { $set: doc },
    { upsert: true },
  );

  return {
    chatId: doc.chatId,
    topicId: doc.topicId,
    title: doc.title,
    updatedAt: doc.updatedAt.toISOString(),
  };
}

async function getHome(feature) {
  const db = await getDbReady();
  const doc = await db.collection(COLLECTION).findOne({ feature });
  if (!doc) {
    return null;
  }

  return {
    chatId: doc.chatId,
    topicId: doc.topicId ?? null,
    title: doc.title ?? null,
    updatedAt: doc.updatedAt?.toISOString?.() || doc.updatedAt,
  };
}

async function getAllHomes() {
  const db = await getDbReady();
  const docs = await db.collection(COLLECTION).find({}).toArray();
  const homes = {};

  for (const doc of docs) {
    homes[doc.feature] = {
      chatId: doc.chatId,
      topicId: doc.topicId ?? null,
      title: doc.title ?? null,
      updatedAt: doc.updatedAt?.toISOString?.() || doc.updatedAt,
    };
  }

  return homes;
}

async function deleteHome(feature) {
  const db = await getDbReady();
  await db.collection(COLLECTION).deleteOne({ feature });
}

module.exports = {
  upsertHome,
  getHome,
  getAllHomes,
  deleteHome,
};
