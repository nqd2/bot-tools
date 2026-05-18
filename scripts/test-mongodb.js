#!/usr/bin/env node
require('dotenv').config();
const { getDbReady } = require('../src/db/mongodb');

async function main() {
  console.log('Connecting to MongoDB...');
  const db = await getDbReady();
  const ping = await db.command({ ping: 1 });
  console.log('OK:', ping);
  const homes = await db.collection('homes').find({}).toArray();
  console.log('homes:', homes.length, 'document(s)');
  process.exit(0);
}

main().catch((error) => {
  console.error('FAILED:', error.message);
  process.exit(1);
});
