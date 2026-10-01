import React from 'react';
import { User, Award, MapPin, LogOut, Phone } from 'lucide-react';
import { translations } from '../utils/i18n';

export default function StudentHeader({ student, onLogout, lang }) {
  const t = translations[lang];

  return (
    <div className="student-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: 700,
          }}
        >
          {student.name ? student.name[0].toUpperCase() : 'S'}
        </div>
        <div className="student-info">
          <h2>{student.name}</h2>
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
          </div>
        </div>
      </div>

      <button className="btn btn-outline btn-sm" onClick={onLogout} style={{ color: '#ef4444', borderColor: '#ef444450' }}>
        <LogOut size={14} />
        <span>{t.logout}</span>
      </button>
    </div>
  );
}
