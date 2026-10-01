'use strict';

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    groupId: {
      type: String,
      default: '',
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    time: {
      type: String,
      default: '',
    },
    topic: {
      type: String,
      default: '',
    },
    homework: {
      type: String,
      default: '',
    },
    hasQuiz: {
      type: Boolean,
      default: false,
    },
    quizMaxScore: {
      type: Number,
      default: null,
    },
    sessionFee: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      default: 'scheduled',
    },
    center: {
      type: String,
      default: '',
    },
    groupName: {
      type: String,
      default: '',
    },
    syncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Session', sessionSchema);
