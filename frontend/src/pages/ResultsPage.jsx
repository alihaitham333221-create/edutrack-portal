import React from 'react';
import { Calendar, CheckCircle2, Trophy, Clock, UserX } from 'lucide-react';
import { useStudentData } from '../hooks/useStudentData';
import { translations } from '../utils/i18n';
import StudentHeader from '../components/StudentHeader';
import BlockedBanner from '../components/BlockedBanner';
import StatCard from '../components/StatCard';
import SessionCard from '../components/SessionCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function ResultsPage({ barcode, onLogout, lang, onContactOpen }) {
  const { data, loading, error } = useStudentData(barcode);
  const t = translations[lang];

  if (loading) return <LoadingSpinner text={t.loading} />;
  if (error)
    return (
      <div style={{ maxWidth: '600px', margin: '48px auto', padding: '0 16px' }}>
        <ErrorMessage message={error} />
      </div>
    );
  if (!data || !data.student) return null;

  const { student, summary, timeline = [] } = data;

  return (
    <div className="dashboard-wrapper">
      <StudentHeader student={student} onLogout={onLogout} lang={lang} />

      {/* Blocked Status Banner & Reason */}
      {student.isBlocked && (
        <BlockedBanner
          student={student}
          lang={lang}
          onContactOpen={onContactOpen}
        />
      )}

      {/* Summary Stat Cards */}
      <div className="stats-grid">
        <StatCard
          title={t.totalSessions}
          value={summary.totalScheduled ?? summary.totalSessions ?? 0}
          icon={<Calendar size={22} />}
          color="#6366f1"
        />
        <StatCard
          title={t.attendedSessions}
          value={summary.totalAttended ?? summary.totalSessions ?? 0}
          icon={<CheckCircle2 size={22} />}
          color="#10b981"
        />
        <StatCard
          title={t.absentSessions}
          value={summary.totalAbsent ?? 0}
          icon={<UserX size={22} />}
          color="#ef4444"
        />
        <StatCard
          title={t.attendanceRate}
          value={`${summary.attendanceRate ?? 100}%`}
          icon={<Clock size={22} />}
          color="#8b5cf6"
        />
        <StatCard
          title={t.avgQuizScore}
          value={`${summary.averageQuizPercentage}%`}
          icon={<Trophy size={22} />}
          color="#f59e0b"
        />
        <StatCard
          title={t.homeworkDone}
          value={`${summary.homeworkDone} / ${summary.totalAttended ?? summary.totalSessions ?? 0}`}
          icon={<CheckCircle2 size={22} />}
          color="#06b6d4"
        />
      </div>

      {/* Timeline Section */}
      <div className="timeline-section">
        <h3>
          <Calendar size={18} /> {t.timelineTitle}
        </h3>

        {timeline.length > 0 ? (
          timeline.map((item, idx) => (
            <SessionCard key={`${item.sessionId || 'session'}-${item.attendanceId || idx}`} item={item} lang={lang} />
          ))
        ) : (
          <div
            style={{
              background: 'var(--card-bg)',
              padding: '36px',
              borderRadius: '12px',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            {t.noDataYet}
          </div>
        )}
      </div>
    </div>
  );
}
