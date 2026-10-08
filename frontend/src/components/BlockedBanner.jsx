import React from 'react';
import { ShieldAlert, AlertCircle, MessageCircle, Phone, Ban } from 'lucide-react';
import { translations } from '../utils/i18n';
import { TEACHER } from '../utils/teacher';

export default function BlockedBanner({ student, lang, onContactOpen }) {
  if (!student?.isBlocked) return null;

  const t = translations[lang] || translations.ar;

  // Build direct WhatsApp link with prefilled inquiry message
  const waLink = (() => {
    const rawPhone = TEACHER.contact?.whatsapp || '';
    const clean = rawPhone.replace(/\D/g, '');
    const full = clean.startsWith('0') ? `2${clean}` : clean;
    const studentInfo = `${student.name || ''} (${student.barcode || ''})`.trim();
    const msg =
      lang === 'ar'
        ? `السلام عليكم أستاذ أحمد، أود الاستفسار بخصوص إيقاف حساب الطالب: ${studentInfo}.\nسبب الإيقاف المسجل: ${student.blockReason || 'غير محدد'}.`
        : `Hello Mr. Ahmed, I would like to inquire about the suspension of student: ${studentInfo}.\nRecorded Reason: ${student.blockReason || 'Not specified'}.`;
    return `https://wa.me/${full}?text=${encodeURIComponent(msg)}`;
  })();

  return (
    <div className="blocked-alert-card" role="alert" aria-live="polite">
      <div className="blocked-alert-top">
        <div className="blocked-alert-icon-wrap">
          <ShieldAlert size={28} className="blocked-icon-alert" />
        </div>
        <div className="blocked-alert-text">
          <div className="blocked-alert-heading-row">
            <h3 className="blocked-alert-title">{t.accountBlockedTitle}</h3>
            <span className="badge-blocked-tag">
              <Ban size={12} />
              <span>{t.blockedBadge}</span>
            </span>
          </div>
          <p className="blocked-alert-subtitle">{t.accountBlockedSubtitle}</p>
        </div>
      </div>

      {/* ── Block Reason Highlight Box ── */}
      <div className="blocked-reason-box">
        <div className="blocked-reason-header">
          <AlertCircle size={17} className="blocked-reason-icon" />
          <span className="blocked-reason-title">{t.blockReasonLabel}</span>
        </div>
        <div className="blocked-reason-body">
          {student.blockReason && student.blockReason.trim() ? (
            <span className="blocked-reason-value">{student.blockReason}</span>
          ) : (
            <span className="blocked-reason-empty">{t.noBlockReasonRecorded}</span>
          )}
        </div>
      </div>

      {/* ── Action / Support Section ── */}
      <div className="blocked-alert-actions">
        <span className="blocked-actions-tip">{t.blockContactAdvice}</span>
        <div className="blocked-buttons-group">
          {onContactOpen && (
            <button
              type="button"
              className="btn btn-blocked-contact"
              onClick={onContactOpen}
            >
              <MessageCircle size={15} />
              <span>{t.contactSupportBtn}</span>
            </button>
          )}

          {TEACHER.contact?.whatsapp && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-blocked-wa"
            >
              <Phone size={15} />
              <span>{t.chatWhatsAppBtn}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
