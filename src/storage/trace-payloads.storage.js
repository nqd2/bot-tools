const { getDbReady } = require('../db/mongodb');

const COLLECTION = 'trace_payloads';

async function saveTracePayload({
  traceId,
  spanId,
  model,
  user,
  request,
  response,
  meta = {},
}) {
  const db = await getDbReady();
  const requestJson = request ?? null;
  const responseJson = response ?? null;

  const doc = {
    traceId: traceId ?? null,
    spanId: spanId ?? null,
    model: model ?? null,
    user: user ?? null,
    request: requestJson,
    response: responseJson,
    requestBytes: requestJson ? Buffer.byteLength(JSON.stringify(requestJson), 'utf8') : 0,
    responseBytes: responseJson ? Buffer.byteLength(JSON.stringify(responseJson), 'utf8') : 0,
    meta,
    createdAt: new Date(),
  };

  const result = await db.collection(COLLECTION).insertOne(doc);
  return {
    id: result.insertedId.toString(),
    requestBytes: doc.requestBytes,
    responseBytes: doc.responseBytes,
  };
}

module.exports = {
  saveTracePayload,
  COLLECTION,
};
