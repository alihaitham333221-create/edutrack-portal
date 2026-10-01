'use strict';

const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    attendanceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    studentId: {
      type: String, // barcode or student id reference
      required: true,
      index: true,
    },
    checkInTime: {
      type: Date,
      default: Date.now,
    },
    homeworkStatus: {
      type: String,
      enum: ['done', 'missed', 'partial', 'pending'],
      default: 'pending',
    },
    homeworkNote: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    sessionTitle: {
      type: String,
      default: '',
    },
    sessionDate: {
      type: String,
      default: '',
    },
    sessionGroupId: {
      type: String,
      default: '',
    },
    sessionTime: {
      type: String,
      default: '',
    },
    sessionCenter: {
      type: String,
      default: '',
    },
    sessionGroupName: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ studentId: 1, sessionDate: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
