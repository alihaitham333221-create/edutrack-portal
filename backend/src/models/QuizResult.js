'use strict';

const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema(
  {
    quizId: {
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
    score: {
      type: Number,
      required: true,
    },
    maxScore: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
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
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

quizResultSchema.index({ studentId: 1, recordedAt: -1 });

module.exports = mongoose.model('QuizResult', quizResultSchema);
