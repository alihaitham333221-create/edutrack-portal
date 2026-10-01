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
 * Perform idempotent full data synchronization
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

  // ── 1. Process Sessions ─────────────────────────────────────────────────────
  const sessionMap = new Map();
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

    await Session.findOneAndUpdate(
      { sessionId: s.id },
      { $set: sessionData },
      { upsert: true, new: true }
    );
    resultStats.sessionsUpserted++;
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

  // ── 3. Process Students ─────────────────────────────────────────────────────
  const internalIdToBarcodeMap = new Map();

  for (const st of students) {
    const barcode = (st.barcode || st.id || '').trim();
    if (!barcode) continue;

    internalIdToBarcodeMap.set(st.id, barcode);
    internalIdToBarcodeMap.set(barcode, barcode);

    const existingStudent = await Student.findOne({ barcode });

    let rawAccessCode  = existingStudent?.rawAccessCode;
    let accessCodeHash = existingStudent?.accessCodeHash;

    if (!accessCodeHash) {
      rawAccessCode  = generateAccessCode();
      accessCodeHash = await Student.hashAccessCode(rawAccessCode);
      resultStats.generatedAccessCodes.push({
        studentId:  st.id,
        name:       st.name,
        barcode,
        accessCode: rawAccessCode,
      });
    }

    const studentGroups = studentGroupsMap.get(st.id) || [];

    const studentData = {
      barcode,
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
      parentPhone: st.parentPhone || '',   // ← stored in DB now
      isBlocked:   !!st.isBlocked,
      groups:      studentGroups,
      syncedAt:    new Date(),
    };

    await Student.findOneAndUpdate(
      { barcode },
      { $set: studentData },
      { upsert: true, new: true }
    );
    resultStats.studentsUpserted++;
  }

  // ── 4. Process Attendance ───────────────────────────────────────────────────
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

    await Attendance.findOneAndUpdate(
      { attendanceId: att.id },
      { $set: attendanceData },
      { upsert: true, new: true }
    );
    resultStats.attendanceUpserted++;
  }

  // ── 5. Process Quiz Results ─────────────────────────────────────────────────
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

    await QuizResult.findOneAndUpdate(
      { quizId: q.id },
      { $set: quizData },
      { upsert: true, new: true }
    );
    resultStats.quizzesUpserted++;
  }

  logger.info(`[SyncService] Completed: ${JSON.stringify(resultStats)}`);
  return resultStats;
}

module.exports = {
  syncFullData,
};
