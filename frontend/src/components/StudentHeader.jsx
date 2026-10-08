import React from 'react';
import { User, Award, MapPin, LogOut, Phone, BookOpen, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { translations } from '../utils/i18n';
import { TEACHER } from '../utils/teacher';

export default function StudentHeader({ student, onLogout, lang }) {
  const t = translations[lang];

  return (
    <div className="student-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: student.isBlocked
              ? 'linear-gradient(135deg, #b91c1c, #ef4444)'
              : 'linear-gradient(135deg, var(--navy-700), var(--navy-500))',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: 800,
            boxShadow: student.isBlocked
              ? '0 4px 12px rgba(239, 68, 68, 0.35)'
              : '0 4px 12px rgba(37, 99, 235, 0.3)',
            flexShrink: 0,
          }}
        >
          {student.name ? student.name[0].toUpperCase() : 'S'}
        </div>
        <div className="student-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2>{student.name}</h2>
            {student.isBlocked ? (
              <span
                className="badge badge-danger"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  background: 'rgba(239, 68, 68, 0.14)',
                  color: '#dc2626',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <ShieldAlert size={13} />
                <span>{t.blockedBadge}</span>
              </span>
            ) : (
              <span
                className="badge badge-success"
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '3px 10px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#059669',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <CheckCircle2 size={13} />
                <span>{t.activeBadge}</span>
              </span>
            )}
          </div>

          {/* Prominent Blocked Reason Display */}
          {student.isBlocked && (
            <div
              style={{
                marginTop: '8px',
                marginBottom: '4px',
                padding: '6px 14px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1.5px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#991b1b',
                flexWrap: 'wrap',
              }}
            >
              <ShieldAlert size={15} color="#dc2626" style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 800, color: '#dc2626' }}>{t.blockReasonLabel}:</span>
              <span style={{ fontWeight: 700 }}>
                {student.blockReason || student.reason || student.notes || t.noBlockReasonRecorded}
              </span>
            </div>
          )}

          <div className="student-meta">
            <span className="badge badge-primary">
              <User size={12} /> {t.studentIdLabel}: {student.barcode}
            </span>
            {student.level && (
              <span className="badge badge-success">
                <Award size={12} /> {student.level}
              </span>
            )}
            {student.center && (
              <span className="badge badge-warning">
                <MapPin size={12} /> {student.center}
              </span>
            )}
            {student.parentPhone && (
              <span className="badge" style={{ background: 'rgba(16,185,129,0.12)', color: '#059669', border: '1px solid rgba(16,185,129,0.25)' }}>
                <Phone size={12} /> {t.parentPhone}: {student.parentPhone}
              </span>
            )}
            {student.isBlocked && student.blockReason && (
              <span
                className="badge badge-danger"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#dc2626',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                <ShieldAlert size={12} /> {t.blockReasonLabel}: {student.blockReason}
              </span>
            )}
            {/* Teacher branding pill */}
            <span
              className="badge"
              style={{
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(10, 35, 122, 0.08))',
                color: 'var(--navy-800)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px 3px 6px',
              }}
            >
              <img
                src={TEACHER.photo}
                alt={TEACHER.name}
                style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <BookOpen size={11} color="var(--navy-600)" />
              <span>
                {lang === 'ar'
                  ? `${TEACHER.nameAr} (${TEACHER.subjectAr})`
                  : `${TEACHER.name} (${TEACHER.subject})`}
              </span>
            </span>
          </div>
        </div>
      </div>

      <button
        className="btn btn-outline btn-sm"
        onClick={onLogout}
        style={{
          color: '#ef4444',
          borderColor: 'rgba(239, 68, 68, 0.35)',
          background: 'rgba(239, 68, 68, 0.06)',
        }}
      >
        <LogOut size={14} />
        <span>{t.logout}</span>
      </button>
    </div>
  );
}
