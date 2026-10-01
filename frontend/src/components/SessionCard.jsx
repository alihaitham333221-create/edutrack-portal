import React from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Trophy,
  Clock,
  MapPin,
  Users,
  BookOpen,
  UserX,
} from 'lucide-react';
import { formatDate } from '../utils/formatters';
import { translations } from '../utils/i18n';

export default function SessionCard({ item, lang }) {
  const t = translations[lang];

  const getHwBadge = (status) => {
    switch (status) {
      case 'done':
        return (
          <span className="badge badge-success">
            <CheckCircle2 size={12} /> {t.hwStatus.done}
          </span>
        );
      case 'missed':
        return (
          <span className="badge badge-danger">
            <XCircle size={12} /> {t.hwStatus.missed}
          </span>
        );
      case 'partial':
        return (
          <span className="badge badge-warning">
            <AlertCircle size={12} /> {t.hwStatus.partial}
          </span>
        );
      default:
        return (
          <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>
            {t.hwStatus.pending}
          </span>
        );
    }
  };

  const isAbsent = !item.attended;

  return (
    <div
      className="session-card"
      style={
        isAbsent
          ? {
              borderInlineStart: '4px solid #ef4444',
              opacity: 0.9,
              background: 'rgba(239,68,68,0.03)',
            }
          : { borderInlineStart: '4px solid #10b981' }
      }
    >
      {/* ── Header ── */}
      <div className="session-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="session-title">{item.sessionTitle}</span>
          {isAbsent ? (
            <span
              className="badge badge-danger"
              style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              <UserX size={11} /> {t.absent}
            </span>
          ) : (
            <span
              className="badge badge-success"
              style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              <CheckCircle2 size={11} /> {t.attended}
            </span>
          )}
        </div>
        <span className="session-date" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={12} /> {formatDate(item.sessionDate)}
        </span>
      </div>

      {/* ── Session Meta: center, time, group ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '12px',
          paddingBottom: '10px',
          borderBottom: '1px solid var(--border, #e2e8f0)',
        }}
      >
        {item.sessionCenter && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} color="#6366f1" /> {item.sessionCenter}
          </span>
        )}
        {item.sessionTime && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} color="#10b981" /> {item.sessionTime}
          </span>
        )}
        {item.sessionGroupName && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Users size={12} color="#8b5cf6" /> {item.sessionGroupName}
          </span>
        )}
        {item.sessionTopic && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <BookOpen size={12} color="#f59e0b" /> {item.sessionTopic}
          </span>
        )}
      </div>

      {/* ── Homework + Quiz (only if student attended) ── */}
      {isAbsent ? (
        <div
          style={{
            fontSize: '12px',
            color: '#ef4444',
            background: 'rgba(239,68,68,0.06)',
            borderRadius: '8px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <UserX size={14} />
          {lang === 'ar' ? 'الطالب لم يحضر هذه الحصة' : 'Student was absent for this session'}
        </div>
      ) : (
        <div className="session-details-grid">
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              {t.homework}
            </div>
            {getHwBadge(item.homeworkStatus)}
            {item.homeworkNote && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <FileText size={12} style={{ display: 'inline', marginEnd: '4px' }} />
                {item.homeworkNote}
              </div>
            )}
          </div>

          {item.quiz ? (
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {t.quizScore}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trophy size={16} color="#f59e0b" />
                <span style={{ fontWeight: 700, fontSize: '15px' }}>
                  {item.quiz.score} / {item.quiz.maxScore}
                </span>
                <span
                  className={`badge ${
                    item.quiz.percentage >= 80
                      ? 'badge-success'
                      : item.quiz.percentage >= 50
                      ? 'badge-warning'
                      : 'badge-danger'
                  }`}
                >
                  {item.quiz.percentage}%
                </span>
              </div>
              {item.quiz.notes && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {item.quiz.notes}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {t.quizScore}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
            </div>
          )}
        </div>
      )}

      {/* ── Teacher notes ── */}
      {!isAbsent && item.notes && (
        <div
          style={{
            marginTop: '10px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            background: 'rgba(0,0,0,0.03)',
            padding: '6px 10px',
            borderRadius: '4px',
          }}
        >
          💬 {item.notes}
        </div>
      )}
    </div>
  );
}
