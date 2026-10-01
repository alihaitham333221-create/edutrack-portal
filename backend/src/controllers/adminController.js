'use strict';

const Student = require('../models/Student');
const { syncSchema } = require('../utils/validators');
const { syncFullData } = require('../services/syncService');

/**
 * @desc    Full sync of EduTrack desktop data into portal MongoDB database
 * @route   POST /api/admin/sync
 * @access  Private (Admin API Key protected)
 */
const syncData = async (req, res, next) => {
  try {
    const { error, value } = syncSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const stats = await syncFullData(value);

    res.json({
      success: true,
      message: 'Data synchronized successfully.',
      stats,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Retrieve all student access codes (for teacher/admin to view/send via WhatsApp)
 * @route   GET /api/admin/students/access-codes
 * @access  Private (Admin API Key protected)
 */
const getAccessCodes = async (req, res, next) => {
  try {
    const students = await Student.find({}, 'barcode name level center rawAccessCode updatedAt').lean();
    res.json({
      success: true,
      students,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update or reset a student's access code
 * @route   PUT /api/admin/students/:barcode/access-code
 * @access  Private (Admin API Key protected)
 */
const updateAccessCode = async (req, res, next) => {
  try {
    const { barcode } = req.params;
    const { accessCode } = req.body;

    if (!accessCode || String(accessCode).trim().length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Access Code must be at least 4 characters long.',
      });
    }

    const newCode = String(accessCode).trim();
    const hash = await Student.hashAccessCode(newCode);

    const student = await Student.findOneAndUpdate(
      { barcode },
      {
        $set: {
          accessCodeHash: hash,
          rawAccessCode: newCode,
        },
      },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    res.json({
      success: true,
      message: 'Access code updated successfully.',
      student: {
        barcode: student.barcode,
        name: student.name,
        rawAccessCode: student.rawAccessCode,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  syncData,
  getAccessCodes,
  updateAccessCode,
};
