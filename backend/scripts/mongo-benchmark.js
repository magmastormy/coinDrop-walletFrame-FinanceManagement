// MongoDB Benchmark Script (Node.js)
// Usage: node mongo-benchmark.js
const { MongoClient } = require('mongodb');

const uri = 'mongodb://root:example@localhost:27017/coinDrop?authSource=admin'; // Docker Compose MongoDB
const dbName = 'coinDrop';
const collectionName = 'benchmarkTest';
const iterations = 10000;

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const col = db.collection(collectionName);
  await col.deleteMany({});

  console.time('Insert');
  for (let i = 0; i < iterations; i++) {
    await col.insertOne({ n: i, value: Math.random() });
  }
  console.timeEnd('Insert');

  console.time('Read');
  for (let i = 0; i < iterations; i++) {
    await col.findOne({ n: i });
  }
  console.timeEnd('Read');

  await client.close();
}

run().catch(console.error);
