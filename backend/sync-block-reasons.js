'use strict';

require('dotenv').config({ path: __dirname + '/.env' });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Error: MONGODB_URI is not defined in .env');
  process.exit(1);
}

// Locate students.json
const studentsJsonPath = path.resolve(__dirname, '../../data/edutrack_data/students.json');
if (!fs.existsSync(studentsJsonPath)) {
  console.error('Error: students.json not found at:', studentsJsonPath);
  process.exit(1);
}

const localStudents = JSON.parse(fs.readFileSync(studentsJsonPath, 'utf8'));
console.log(`Loaded ${localStudents.length} students from local database.`);

async function run() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, {
      dbName: 'edutrack_portal',
      serverSelectionTimeoutMS: 10000,
    });
    console.log('Connected successfully!');

    const Student = mongoose.model(
      'Student',
      new mongoose.Schema({}, { strict: false })
    );

    let updatedCount = 0;
    let blockedCount = 0;

    for (const s of localStudents) {
      const barcode = (s.barcode || s.id || '').trim();
      if (!barcode) continue;

      const isBlocked = Boolean(s.isBlocked);
      const blockReason = (s.blockReason || s.reason || s.notes || '').trim();

      if (isBlocked) blockedCount++;

      const res = await Student.updateOne(
        { barcode },
        {
          $set: {
            isBlocked,
            blockReason,
          },
        }
      );

      if (res.matchedCount > 0) {
        updatedCount++;
        if (isBlocked) {
          console.log(`Updated student [${barcode}] ${s.name}: isBlocked=${isBlocked}, reason="${blockReason}"`);
        }
      }
    }

    console.log('\n--- Sync Finished ---');
    console.log(`Total local blocked students: ${blockedCount}`);
    console.log(`Matched and updated in MongoDB: ${updatedCount}`);
  } catch (err) {
    console.error('Sync failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

run();
