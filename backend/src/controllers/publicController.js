'use strict';

const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const QuizResult = require('../models/QuizResult');
const Session = require('../models/Session');
const { verifySchema } = require('../utils/validators');

/**
 * Normalizes any date string into standard YYYY-MM-DD
 */
function getNormalizedDate(rawDate) {
  if (!rawDate) return '';
  const str = String(rawDate).trim();
  if (str.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return str;
}

/**
 * @desc    Verify student Barcode + Access Code and issue JWT
 * @route   POST /api/public/verify
 * @access  Public
 */
const verifyStudent = async (req, res, next) => {
  try {
    const { error, value } = verifySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { barcode, accessCode } = value;

    // Find student by barcode
    const student = await Student.findOne({ barcode });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found. Please check your Student ID and try again.',
      });
    }

    // Match access code only if provided
    if (accessCode && student.rawAccessCode) {
      const isMatch = await student.matchAccessCode(accessCode);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid Access Code.',
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { barcode: student.barcode },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    res.json({
      success: true,
      token,
      student: {
        barcode:     student.barcode,
        name:        student.name,
        level:       student.level,
        center:      student.center,
        groups:      student.groups,
        parentPhone: student.parentPhone || '',
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get full student results history & summary stats
 *          Includes ABSENT sessions.
 *          Deduplicates multiple sessions for the SAME group on the SAME day:
 *          - If student attended ANY slot, only the attended slot appears; the other is NOT marked absent.
 *          - If student attended NONE, only ONE slot appears as absent (not multiple absences).
 * @route   GET /api/public/student/:barcode/results
 * @access  Private (JWT protected)
 */
const getStudentResults = async (req, res, next) => {
  try {
    const { barcode } = req.params;

    // Expose parentPhone for the parent viewing the page; hide raw hash & private student phone
    const student = await Student.findOne({ barcode })
      .select('-accessCodeHash -phone')
      .lean();
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // ── Fetch attendance records for this student ─────────────────────────────
    const attendance = await Attendance.find({ studentId: barcode })
      .sort({ sessionDate: -1, createdAt: -1 })
      .lean();

    // ── Fetch quiz results ────────────────────────────────────────────────────
    const quizResults = await QuizResult.find({ studentId: barcode })
      .sort({ recordedAt: -1 })
      .lean();

    // ── Find ALL sessions for the student's groups or that student attended ───
    const studentGroupIds = (student.groups || []).map((g) => g.groupId).filter(Boolean);
    const attendedSessionIds = new Set(attendance.map((a) => a.sessionId).filter(Boolean));

    const sessionConditions = [];
    if (studentGroupIds.length > 0) {
      sessionConditions.push({ groupId: { $in: studentGroupIds } });
    }
    if (attendedSessionIds.size > 0) {
      sessionConditions.push({ sessionId: { $in: Array.from(attendedSessionIds) } });
    }

    let allRelevantSessions = [];
    if (sessionConditions.length > 0) {
      allRelevantSessions = await Session.find({ $or: sessionConditions })
        .sort({ date: -1 })
        .lean();
    }

    // Fallback: if student attended a session not in Session collection, synthesize it
    const foundSessionIds = new Set(allRelevantSessions.map((s) => s.sessionId));
    for (const att of attendance) {
      if (att.sessionId && !foundSessionIds.has(att.sessionId)) {
        allRelevantSessions.push({
          sessionId: att.sessionId,
          title: att.sessionTitle || 'Session',
          date: att.sessionDate || '',
          time: att.sessionTime || '',
          center: att.sessionCenter || '',
          groupName: att.sessionGroupName || '',
          groupId: att.sessionGroupId || '',
        });
        foundSessionIds.add(att.sessionId);
      }
    }

    // ── Build lookup maps ─────────────────────────────────────────────────────
    const quizMapBySession    = new Map(quizResults.map((q) => [q.sessionId, q]));
    const attendanceBySession = new Map(attendance.map((a) => [a.sessionId, a]));

    // ── Deduplicate sessions for the SAME group on the SAME day ───────────────
    // When a group has multiple sessions/slots on the same date (e.g. 15:00 and 17:00):
    // 1. If the student attended ANY of them:
    //    -> Keep only the attended session; suppress the other slot so it does NOT show as absent.
    // 2. If the student attended NONE:
    //    -> Keep only ONE session as absent; suppress the other so they don't count as 2 absences.
    const clusters = new Map();
    const ungrouped = [];

    for (const session of allRelevantSessions) {
      const gid = (session.groupId || session.sessionGroupId || session.groupName || '').trim();
      const sDate = getNormalizedDate(session.date);

      if (gid && sDate) {
        const clusterKey = `${gid}__${sDate}`;
        if (!clusters.has(clusterKey)) {
          clusters.set(clusterKey, []);
        }
        clusters.get(clusterKey).push(session);
      } else {
        ungrouped.push(session);
      }
    }

    const filteredSessions = [];

    for (const cluster of clusters.values()) {
      if (cluster.length === 1) {
        filteredSessions.push(cluster[0]);
        continue;
      }

      // Check which sessions in this cluster were attended
      const attendedInCluster = cluster.filter((s) => attendedSessionIds.has(s.sessionId));

      if (attendedInCluster.length > 0) {
        // Student attended at least one slot:
        // Pick the best attended session (prefer one with a recorded quiz or homework, else first)
        const withQuiz = attendedInCluster.find((s) => quizMapBySession.has(s.sessionId));
        const withHw = attendedInCluster.find((s) => {
          const a = attendanceBySession.get(s.sessionId);
          return a && a.homeworkStatus && a.homeworkStatus !== 'pending';
        });
        const chosen = withQuiz || withHw || attendedInCluster[0];

        // Link any quiz or attendance info from the cluster if not directly attached
        if (!quizMapBySession.has(chosen.sessionId)) {
          const anyQuiz = cluster.map((s) => quizMapBySession.get(s.sessionId)).find(Boolean);
          if (anyQuiz) {
            quizMapBySession.set(chosen.sessionId, anyQuiz);
          }
        }
        if (!attendanceBySession.has(chosen.sessionId)) {
          const anyAtt = cluster.map((s) => attendanceBySession.get(s.sessionId)).find(Boolean);
          if (anyAtt) {
            attendanceBySession.set(chosen.sessionId, anyAtt);
          }
        }

        filteredSessions.push(chosen);
      } else {
        // Student attended NONE in this cluster:
        // Keep ONLY ONE session as absent so the student is only marked absent once for this lesson
        filteredSessions.push(cluster[0]);
      }
    }

    filteredSessions.push(...ungrouped);

    // ── Summary stats ─────────────────────────────────────────────────────────
    const attendedInTimeline = filteredSessions.filter((s) => attendedSessionIds.has(s.sessionId));
    const absentInTimeline   = filteredSessions.filter((s) => !attendedSessionIds.has(s.sessionId));

    const totalAttended  = attendedInTimeline.length;
    const totalAbsent    = absentInTimeline.length;
    const totalScheduled = totalAttended + totalAbsent;

    const homeworkDone = attendedInTimeline.filter((s) => {
      const a = attendanceBySession.get(s.sessionId);
      return a && a.homeworkStatus === 'done';
    }).length;
    const homeworkMissed = attendedInTimeline.filter((s) => {
      const a = attendanceBySession.get(s.sessionId);
      return a && a.homeworkStatus === 'missed';
    }).length;
    const homeworkPartial = attendedInTimeline.filter((s) => {
      const a = attendanceBySession.get(s.sessionId);
      return a && a.homeworkStatus === 'partial';
    }).length;

    const timelineQuizzes = filteredSessions
      .map((s) => quizMapBySession.get(s.sessionId))
      .filter(Boolean);

    const totalQuizzes          = timelineQuizzes.length;
    const averageQuizPercentage = totalQuizzes > 0
      ? Math.round(timelineQuizzes.reduce((acc, q) => acc + (q.percentage || 0), 0) / totalQuizzes)
      : 0;

    const attendanceRate = totalScheduled > 0
      ? Math.round((totalAttended / totalScheduled) * 100)
      : 100;

    // ── Build unified timeline ─────────────────────────────────────────────────
    const timeline = filteredSessions.map((session) => {
      const attended = attendedSessionIds.has(session.sessionId);
      const att      = attendanceBySession.get(session.sessionId) || null;
      const quiz     = quizMapBySession.get(session.sessionId)    || null;

      return {
        sessionId:        session.sessionId,
        sessionTitle:     session.title      || 'Session',
        sessionDate:      session.date       || '',
        sessionTime:      session.time       || '',
        sessionCenter:    session.center     || '',
        sessionGroupName: session.groupName  || '',
        sessionTopic:     session.topic      || '',
        sessionHomework:  session.homework   || '',
        attended,
        // Attendance-specific fields (null if absent)
        attendanceId:     att?.attendanceId   || null,
        checkInTime:      att?.checkInTime    || null,
        homeworkStatus:   att?.homeworkStatus || null,
        homeworkNote:     att?.homeworkNote   || '',
        notes:            att?.notes          || '',
        // Quiz (null if no quiz or absent)
        quiz: quiz
          ? {
              score:      quiz.score,
              maxScore:   quiz.maxScore,
              percentage: quiz.percentage,
              notes:      quiz.notes,
            }
          : null,
      };
    });

    // Sort timeline descending by date, then by time
    timeline.sort((a, b) => {
      const dateA = a.sessionDate || '';
      const dateB = b.sessionDate || '';
      const comp = dateB.localeCompare(dateA);
      if (comp !== 0) return comp;
      return (a.sessionTime || '').localeCompare(b.sessionTime || '');
    });

    res.json({
      success: true,
      student,
      summary: {
        totalScheduled,
        totalAttended,
        totalAbsent,
        attendanceRate,
        homeworkDone,
        homeworkMissed,
        homeworkPartial,
        totalQuizzes,
        averageQuizPercentage,
      },
      timeline,
      quizResults,
      attendance,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  verifyStudent,
  getStudentResults,
};
