// removes all old data from target url first
// add target mongo uri and source mongo uri in .env 

import { MongoClient } from "mongodb";
import dotenv from 'dotenv';

dotenv.config();
const SOURCE_URI = process.env.SOURCE_MONGO_URI;
const TARGET_URI = process.env.TARGET_MONGO_URI;

const SOURCE_DB_NAME = "SpeeUp";
const TARGET_DB_NAME = "geeta-ecom";

async function copyDatabase() {
  const sourceClient = new MongoClient(SOURCE_URI);
  const targetClient = new MongoClient(TARGET_URI);

  try {
    console.log("🔌 Connecting to databases...");
    await sourceClient.connect();
    await targetClient.connect();

    const sourceDB = sourceClient.db(SOURCE_DB_NAME);
    const targetDB = targetClient.db(TARGET_DB_NAME);

    console.log(`⚠️ DROPPING TARGET DATABASE: ${TARGET_DB_NAME}`);
    await targetDB.dropDatabase(); // 🔥 FULL CLEAN

    const collections = await sourceDB.listCollections().toArray();

    for (const { name } of collections) {
      console.log(`📦 Copying collection: ${name}`);

      const sourceCol = sourceDB.collection(name);
      const targetCol = targetDB.collection(name);

      const docs = await sourceCol.find({}).toArray();
      if (docs.length > 0) {
        await targetCol.insertMany(docs);
      }

      // Copy indexes
      const indexes = await sourceCol.indexes();
      for (const index of indexes) {
        if (index.name !== "_id_") {
          await targetCol.createIndex(index.key, index);
        }
      }
    }

    console.log("✅ Database fully mirrored successfully");
  } catch (err) {
    console.error("❌ Database copy failed:", err);
  } finally {
    await sourceClient.close();
    await targetClient.close();
  }
}

copyDatabase();

