'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema(
  {
    barcode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    accessCodeHash: {
      type: String,
      required: true,
    },
    rawAccessCode: {
      type: String, // Kept or communicated if auto-generated, or can be null
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      default: '',
    },
    levelId: {
      type: String,
      default: '',
    },
    center: {
      type: String,
      default: '',
    },
    centerId: {
      type: String,
      default: '',
    },
    dob: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
      select: false, // Do not expose by default
    },
    parentPhone: {
      type: String,
      default: '',
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    groups: [
      {
        groupId: String,
        groupName: String,
        level: String,
        center: String,
        dayOfWeek: String,
        time: String,
      },
    ],
    syncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify access code
studentSchema.methods.matchAccessCode = async function (enteredCode) {
  return await bcrypt.compare(String(enteredCode), this.accessCodeHash);
};

// Static helper to hash access code
studentSchema.statics.hashAccessCode = async function (code) {
  const salt = await bcrypt.genSalt(8);
  return await bcrypt.hash(String(code), salt);
};

module.exports = mongoose.model('Student', studentSchema);
