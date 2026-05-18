const fs = require('fs').promises;
const path = require('path');

const DATA_PATH = path.join(process.cwd(), 'data', 'homes.json');
const BLOB_PATHNAME = 'bot-tools/homes.json';

let cache = null;

async function readFromBlob() {
  const { list } = require('@vercel/blob');
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const { blobs } = await list({ prefix: BLOB_PATHNAME, token });
  const blob = blobs.find((item) => item.pathname === BLOB_PATHNAME);

  if (!blob) {
    return {};
  }

  const response = await fetch(blob.url);
  if (!response.ok) {
    throw new Error(`Failed to fetch homes blob: ${response.status}`);
  }

  return response.json();
}

async function writeToBlob(data) {
  const { put } = require('@vercel/blob');
  await put(BLOB_PATHNAME, JSON.stringify(data, null, 2), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}

async function readFromFile() {
  const raw = await fs.readFile(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

async function writeToFile(data) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`);
}

async function readAll() {
  if (cache) {
    return cache;
  }

  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      cache = await readFromBlob();
      return cache;
    }

    cache = await readFromFile();
    return cache;
  } catch (error) {
    if (error.code === 'ENOENT') {
      cache = {};
      return cache;
    }

    console.warn('homes.storage read failed:', error.message);
    cache = {};
    return cache;
  }
}

async function writeAll(data) {
  cache = data;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await writeToBlob(data);
    return;
  }

  if (process.env.VERCEL) {
    throw new Error(
      'Vercel cần Blob store (BLOB_READ_WRITE_TOKEN). Project Settings → Storage → Create Blob → redeploy.',
    );
  }

  await writeToFile(data);
}

function clearCache() {
  cache = null;
}

module.exports = {
  readAll,
  writeAll,
  clearCache,
};
