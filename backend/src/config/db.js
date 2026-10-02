'use strict';

const mongoose = require('mongoose');

let cachedConn = null;
let cachedPromise = null;

/**
 * Connect to MongoDB instance using Mongoose (Serverless-safe with connection caching)
 */
const connectDB = async () => {
  if (cachedConn && mongoose.connection.readyState === 1) {
    return cachedConn;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[MongoDB] Warning: MONGODB_URI environment variable is missing.');
    return null;
  }

  if (!cachedPromise) {
    cachedPromise = mongoose.connect(uri, {
      autoIndex: false,
      dbName: 'edutrack_portal',
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      bufferCommands: false,
    }).then((conn) => {
      console.log(`[MongoDB] Connected: ${conn.connection.host}`);
      return conn;
    }).catch((err) => {
      cachedPromise = null;
      console.error(`[MongoDB] Connection Error: ${err.message}`);
      throw err;
    });
  }

  try {
    cachedConn = await cachedPromise;
    return cachedConn;
  } catch (error) {
    cachedPromise = null;
    return null;
  }
};

module.exports = connectDB;
