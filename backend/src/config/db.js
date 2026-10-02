'use strict';

const mongoose = require('mongoose');

let cachedConnection = null;

/**
 * Connect to MongoDB instance using Mongoose (Serverless-safe with connection caching)
 */
const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[MongoDB] Warning: MONGODB_URI environment variable is missing.');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: process.env.NODE_ENV !== 'production',
      dbName: 'edutrack_portal',
      serverSelectionTimeoutMS: 8000,
    });
    cachedConnection = conn;
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection Error: ${error.message}`);
    // Never kill process on Vercel/serverless to avoid FUNCTION_INVOCATION_FAILED (500)
    if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    return null;
  }
};

module.exports = connectDB;
