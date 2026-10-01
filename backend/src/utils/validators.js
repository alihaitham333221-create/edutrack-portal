'use strict';

const Joi = require('joi');

const verifySchema = Joi.object({
  barcode: Joi.string().required().trim().messages({
    'string.empty': 'Student ID (Barcode) is required.',
  }),
  accessCode: Joi.string().allow('', null).trim(),
});

const syncSchema = Joi.object({
  students: Joi.array().items(Joi.object().unknown(true)).default([]),
  groups: Joi.array().items(Joi.object().unknown(true)).default([]),
  sessions: Joi.array().items(Joi.object().unknown(true)).default([]),
  attendance: Joi.array().items(Joi.object().unknown(true)).default([]),
  quizzes: Joi.array().items(Joi.object().unknown(true)).default([]),
});

module.exports = {
  verifySchema,
  syncSchema,
};
