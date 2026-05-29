// api/_db.js — MongoDB connection (shared across all handlers)
const { MongoClient } = require('mongodb');

const uri    = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;

async function getDb() {
  if (!db) {
    await client.connect();
    db = client.db('rfid_inventory');
  }
  return db;
}

module.exports = { getDb };
