#!/usr/bin/env node
/**
 * Lấy request/response đã lưu: node scripts/get-trace-payload.js <mongo_id>
 */
require('dotenv').config();
const { ObjectId } = require('mongodb');
const { getDbReady } = require('../src/db/mongodb');

const id = process.argv[2];
if (!id) {
  console.error('Usage: node scripts/get-trace-payload.js <mongo_id>');
  process.exit(1);
}

async function main() {
  const db = await getDbReady();
  const doc = await db.collection('trace_payloads').findOne({
    _id: new ObjectId(id),
  });

  if (!doc) {
    console.error('Not found:', id);
    process.exit(1);
  }

  console.log(JSON.stringify({
    _id: doc._id,
    model: doc.model,
    user: doc.user,
    traceId: doc.traceId,
    requestBytes: doc.requestBytes,
    responseBytes: doc.responseBytes,
    createdAt: doc.createdAt,
    request: doc.request,
    response: doc.response,
  }, null, 2));
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
