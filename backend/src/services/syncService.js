'use strict';

const Student = require('../models/Student');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const QuizResult = require('../models/QuizResult');
const logger = require('../utils/logger');

/**
 * Generate a random 6-digit PIN string
 */
function generateAccessCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Perform idempotent full data synchronization using bulk operations
 */
async function syncFullData(payload) {
  const { students = [], groups = [], sessions = [], attendance = [], quizzes = [] } = payload;

  const resultStats = {
    studentsUpserted: 0,
    sessionsUpserted: 0,
    attendanceUpserted: 0,
    quizzesUpserted: 0,
    generatedAccessCodes: [],
  };

  // ── Build group lookup map ──────────────────────────────────────────────────
  // groupId → { name, center, dayOfWeek, time, studentIds }
  const groupMap = new Map();
  for (const g of groups) {
    if (g.id) {
      groupMap.set(g.id, {
        name:       g.name      || '',
        center:     g.center    || '',
        dayOfWeek:  g.dayOfWeek || '',
        time:       g.time      || '',
        studentIds: Array.isArray(g.studentIds) ? g.studentIds : [],
      });
    }
  }

  // ── 1. Process Sessions (Bulk) ──────────────────────────────────────────────
  const sessionMap = new Map();
  const sessionOpsMap = new Map();

  for (const s of sessions) {
    if (!s.id) continue;
    const group = groupMap.get(s.groupId) || {};
    const sessionData = {
      sessionId:    s.id,
      title:        s.title        || 'Untitled Session',
      groupId:      s.groupId      || '',
      groupName:    group.name     || '',
      center:       group.center   || s.center  || '',
      date:         s.date         || new Date().toISOString().slice(0, 10),
      time:         s.time         || group.time || '',
      topic:        s.topic        || '',
      homework:     s.homework     || '',
      hasQuiz:      !!s.hasQuiz,
      quizMaxScore: s.quizMaxScore || null,
      sessionFee:   Number(s.sessionFee) || 0,
      status:       s.status       || 'scheduled',
      syncedAt:     new Date(),
    };

    sessionMap.set(s.id, sessionData);

    sessionOpsMap.set(s.id, {
      updateOne: {
        filter: { sessionId: s.id },
        update: { $set: sessionData },
        upsert: true,
      },
    });
  }

  if (sessionOpsMap.size > 0) {
    await Session.bulkWrite(Array.from(sessionOpsMap.values()), { ordered: false });
    resultStats.sessionsUpserted = sessionOpsMap.size;
  }

  // ── 2. Build student→groups map ─────────────────────────────────────────────
  const studentGroupsMap = new Map();
  for (const g of groups) {
    if (Array.isArray(g.studentIds)) {
      for (const stId of g.studentIds) {
        if (!studentGroupsMap.has(stId)) studentGroupsMap.set(stId, []);
        studentGroupsMap.get(stId).push({
          groupId:   g.id,
          groupName: g.name      || '',
          level:     g.level     || '',
          center:    g.center    || '',
          dayOfWeek: g.dayOfWeek || '',
          time:      g.time      || '',
        });
      }
    }
  }

  // ── 3. Process Students (Bulk with pre-fetched existing records) ─────────────
  const internalIdToBarcodeMap = new Map();
  const deduplicatedStudentsMap = new Map();

  for (const st of students) {
    const barcode = (st.barcode || st.id || '').trim();
    if (!barcode) continue;

    internalIdToBarcodeMap.set(st.id, barcode);
    internalIdToBarcodeMap.set(barcode, barcode);
    deduplicatedStudentsMap.set(barcode, { ...st, barcode });
  }

  const validStudents = Array.from(deduplicatedStudentsMap.values());
  const allBarcodes = validStudents.map(s => s.barcode);

  // Single query for all existing students
  const existingStudents = allBarcodes.length > 0
    ? await Student.find({ barcode: { $in: allBarcodes } }, 'barcode rawAccessCode accessCodeHash').lean()
    : [];

  const existingMap = new Map(existingStudents.map(s => [s.barcode, s]));

  // Generate hashes only for new students missing an access code
  const newCodePromises = [];
  for (const st of validStudents) {
    const existing = existingMap.get(st.barcode);
    if (!existing?.accessCodeHash) {
      const rawAccessCode = generateAccessCode();
      resultStats.generatedAccessCodes.push({
        studentId:  st.id,
        name:       st.name,
        barcode:    st.barcode,
        accessCode: rawAccessCode,
      });

      newCodePromises.push(
        (async () => {
          const hash = await Student.hashAccessCode(rawAccessCode);
          return { barcode: st.barcode, rawAccessCode, accessCodeHash: hash };
        })()
      );
    }
  }

  const generatedCodes = await Promise.all(newCodePromises);
  const generatedMap = new Map(generatedCodes.map(c => [c.barcode, c]));

  const studentOps = [];
  for (const st of validStudents) {
    const existing = existingMap.get(st.barcode);
    const generated = generatedMap.get(st.barcode);

    const rawAccessCode = existing?.rawAccessCode || generated?.rawAccessCode;
    const accessCodeHash = existing?.accessCodeHash || generated?.accessCodeHash;

    const studentGroups = studentGroupsMap.get(st.id) || [];

    const studentData = {
      barcode:     st.barcode,
      accessCodeHash,
      rawAccessCode,
      name:        st.name        || 'Unknown Student',
      level:       st.level       || '',
      levelId:     st.levelId     || '',
      center:      st.center      || '',
      centerId:    st.centerId    || '',
      dob:         st.dob         || '',
      email:       st.email       || '',
      phone:       st.phone       || '',
      parentPhone: st.parentPhone || '',
      isBlocked:   !!st.isBlocked,
      blockReason: st.blockReason || st.reason || st.notes || '',
      groups:      studentGroups,
      syncedAt:    new Date(),
    };

    studentOps.push({
      updateOne: {
        filter: { barcode: st.barcode },
        update: { $set: studentData },
        upsert: true,
      },
    });
  }

  if (studentOps.length > 0) {
    await Student.bulkWrite(studentOps, { ordered: false });
    resultStats.studentsUpserted = studentOps.length;
  }

  // ── 4. Process Attendance (Bulk) ────────────────────────────────────────────
  const attendanceOpsMap = new Map();
  for (const att of attendance) {
    if (!att.id || !att.sessionId || !att.studentId) continue;

    const studentBarcode = internalIdToBarcodeMap.get(att.studentId) || att.barcode || att.studentId;
    const sessionInfo    = sessionMap.get(att.sessionId);

    const attendanceData = {
      attendanceId:     att.id,
      sessionId:        att.sessionId,
      studentId:        studentBarcode,
      checkInTime:      att.checkInTime ? new Date(att.checkInTime) : new Date(),
      homeworkStatus:   ['done', 'missed', 'partial', 'pending'].includes(att.homeworkStatus)
        ? att.homeworkStatus : 'pending',
      homeworkNote:     att.homeworkNote    || '',
      notes:            att.notes           || '',
      sessionTitle:     sessionInfo?.title     || '',
      sessionDate:      sessionInfo?.date      || '',
      sessionGroupId:   sessionInfo?.groupId   || '',
      sessionGroupName: sessionInfo?.groupName || '',
      sessionTime:      sessionInfo?.time      || '',
      sessionCenter:    sessionInfo?.center    || '',
    };

    attendanceOpsMap.set(att.id, {
      updateOne: {
        filter: { attendanceId: att.id },
        update: { $set: attendanceData },
        upsert: true,
      },
    });
  }

  if (attendanceOpsMap.size > 0) {
    await Attendance.bulkWrite(Array.from(attendanceOpsMap.values()), { ordered: false });
    resultStats.attendanceUpserted = attendanceOpsMap.size;
  }

  // ── 5. Process Quiz Results (Bulk) ──────────────────────────────────────────
  const quizOpsMap = new Map();
  for (const q of quizzes) {
    if (!q.id || !q.sessionId || !q.studentId) continue;

    const studentBarcode = internalIdToBarcodeMap.get(q.studentId) || q.studentId;
    const sessionInfo    = sessionMap.get(q.sessionId);
    const score          = Number(q.score)    || 0;
    const maxScore       = Number(q.maxScore) || 100;
    const percentage     = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    const quizData = {
      quizId:       q.id,
      sessionId:    q.sessionId,
      studentId:    studentBarcode,
      score,
      maxScore,
      percentage,
      notes:        q.notes       || '',
      sessionTitle: sessionInfo?.title || '',
      sessionDate:  sessionInfo?.date  || '',
      recordedAt:   q.recordedAt ? new Date(q.recordedAt) : new Date(),
    };

    quizOpsMap.set(q.id, {
      updateOne: {
        filter: { quizId: q.id },
        update: { $set: quizData },
        upsert: true,
      },
    });
  }

  if (quizOpsMap.size > 0) {
    await QuizResult.bulkWrite(Array.from(quizOpsMap.values()), { ordered: false });
    resultStats.quizzesUpserted = quizOpsMap.size;
  }

  logger.info(`[SyncService] Completed: ${JSON.stringify(resultStats)}`);
  return resultStats;
}

module.exports = {
  syncFullData,
};
