#!/usr/bin/env node
/**
 * Xem log OpenRouter gần đây trong MongoDB.
 * Usage: node scripts/check-openrouter-logs.js [limit]
 */
require('dotenv').config();
const { getDbReady } = require('../src/db/mongodb');

const limit = Number(process.argv[2]) || 10;

async function main() {
  const db = await getDbReady();
  const logs = await db
    .collection('logs')
    .find({ source: 'openrouter' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  if (!logs.length) {
    console.log('Không có log openrouter nào.');
    console.log('→ OpenRouter chưa POST tới webhook (Broadcast / API key filter / URL sai).');
    process.exit(1);
  }

  for (const log of logs) {
    console.log('---');
    console.log(log.createdAt, log.event, log.level);
    console.log(log.message);
    if (log.meta) {
      console.log(JSON.stringify(log.meta, null, 2));
    }
  }

  const homes = await db.collection('homes').find({}).toArray();
  const payloads = await db
    .collection('trace_payloads')
    .find({})
    .sort({ createdAt: -1 })
    .limit(3)
    .toArray();

  console.log('\nhomes:', homes.length ? homes : '(empty — chạy /sethome openrouter)');
  console.log(
    'trace_payloads (latest):',
    payloads.length
      ? payloads.map((p) => `${p._id} ${p.model} req=${p.requestBytes}B res=${p.responseBytes}B`)
      : '(none)',
  );
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
