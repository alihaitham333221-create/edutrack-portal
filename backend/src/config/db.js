'use strict';

const mongoose = require('mongoose');

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
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
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
      throw err;
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
