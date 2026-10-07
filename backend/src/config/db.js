'use strict';

const mongoose = require('mongoose');

let cachedConn = null;
let cachedPromise = null;

// Clear cached connection when Mongoose disconnects or encounters an error
mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected. Resetting cached connection.');
  cachedConn = null;
  cachedPromise = null;
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Connection error:', err.message);
  cachedConn = null;
  cachedPromise = null;
});

/**
 * Connect to MongoDB instance using Mongoose (Serverless-safe with automatic reconnect)
 */
const connectDB = async () => {
  // If already connected and ready, return existing connection
  if (mongoose.connection.readyState === 1 && cachedConn) {
    return cachedConn;
  }

  // If connection was lost or disconnected, invalidate stale cache
  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    cachedPromise = null;
    cachedConn = null;
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
      socketTimeoutMS: 45000,
      bufferCommands: false,
      maxPoolSize: 10,
    }).then((conn) => {
      console.log(`[MongoDB] Connected: ${conn.connection.host}`);
      cachedConn = conn;
      return conn;
    }).catch((err) => {
      cachedPromise = null;
      cachedConn = null;
      console.error(`[MongoDB] Connection Error: ${err.message}`);
      return null;
    });
  }

  try {
    cachedConn = await cachedPromise;
    return cachedConn;
  } catch (error) {
    cachedPromise = null;
    cachedConn = null;
    return null;
  }
};

module.exports = connectDB;
