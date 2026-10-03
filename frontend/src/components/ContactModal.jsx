import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  Copy,
  Check,
  Clock,
  MapPin,
  ExternalLink,
  Headphones,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { translations } from '../utils/i18n';
import { TEACHER } from '../utils/teacher';

export default function ContactModal({ isOpen, onClose, lang = 'ar' }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const t = translations[lang];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getWaLink = (phone, text = '') => {
    const clean = (phone || '').replace(/\D/g, '');
    const full = clean.startsWith('0') ? `2${clean}` : clean;
    const msg = encodeURIComponent(
      text ||
        (lang === 'ar'
          ? 'السلام عليكم، أود الاستفسار بخصوص بوابة الطالب - مستر أحمد حلي.'
          : 'Hello, I would like to inquire about the student portal - Mr. Ahmed Helly.')
    );
    return `https://wa.me/${full}?text=${msg}`;
  };

  const contact = TEACHER.contact || {};

  return (
    <div
      className="contact-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="contact-modal-card">
        {/* ── Modal Header ── */}
        <div className="contact-modal-header">
          <div className="contact-teacher-summary">
            <img
              src={TEACHER.photo}
              alt={TEACHER.name}
              className="contact-teacher-photo"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <div className="contact-badge-pill">
                <Sparkles size={12} />
                <span>{lang === 'ar' ? TEACHER.subjectAr : TEACHER.subject}</span>
              </div>
              <h3 className="contact-teacher-name">
                {lang === 'ar' ? TEACHER.nameAr : TEACHER.name}
              </h3>
              <p className="contact-teacher-tagline">
                {t.contactSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="contact-close-btn"
            onClick={onClose}
            aria-label={t.closeModal}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Main Channels Grid ── */}
        <div className="contact-channels-grid">
          {/* 1. Teacher WhatsApp */}
          {contact.whatsapp && (
            <div className="contact-channel-card contact-channel-whatsapp">
              <div className="contact-channel-icon-wrap wa-icon-wrap">
                <MessageCircle size={22} />
              </div>
              <div className="contact-channel-info">
                <div className="contact-channel-title">
                  {lang === 'ar' ? 'واتساب الأستاذ المباشر' : 'Teacher Direct WhatsApp'}
                </div>
                <div className="contact-channel-value" dir="ltr">
                  {contact.whatsapp}
                </div>
              </div>
              <div className="contact-channel-actions">
                <a
                  href={getWaLink(contact.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-wa-action"
                >
                  <MessageCircle size={15} />
                  <span>{lang === 'ar' ? 'محادثة' : 'Chat'}</span>
                </a>
                <button
                  type="button"
                  className="btn btn-copy-action"
                  onClick={() => handleCopy(contact.whatsapp, 'teacher-wa')}
                  title={t.copyNumber}
                >
                  {copiedKey === 'teacher-wa' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}

          {/* 2. Direct Phone Call */}
          {contact.phone && (
            <div className="contact-channel-card">
              <div className="contact-channel-icon-wrap phone-icon-wrap">
                <Phone size={22} />
              </div>
              <div className="contact-channel-info">
                <div className="contact-channel-title">
                  {lang === 'ar' ? 'الاتصال الهاتفي' : 'Phone Call'}
                </div>
                <div className="contact-channel-value" dir="ltr">
                  {contact.phone}
                </div>
              </div>
              <div className="contact-channel-actions">
                <a
                  href={`tel:${contact.phone}`}
                  className="btn btn-phone-action"
                >
                  <Phone size={14} />
                  <span>{lang === 'ar' ? 'اتصال' : 'Call'}</span>
                </a>
                <button
                  type="button"
                  className="btn btn-copy-action"
                  onClick={() => handleCopy(contact.phone, 'teacher-phone')}
                  title={t.copyNumber}
                >
                  {copiedKey === 'teacher-phone' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}

          {/* 3. Assistant & Support */}
          {contact.assistantPhone && (
            <div className="contact-channel-card contact-channel-assistant">
              <div className="contact-channel-icon-wrap support-icon-wrap">
                <Headphones size={22} />
              </div>
              <div className="contact-channel-info">
                <div className="contact-channel-title">
                  {t.assistantSupport}
                </div>
                <div className="contact-channel-desc">
                  {lang === 'ar'
                    ? 'لاستفسارات الدرجات، مواعيد المجموعات، وأكواد الطلاب'
                    : 'For score inquiries, schedules, and barcode recovery'}
                </div>
                <div className="contact-channel-value" dir="ltr" style={{ marginTop: '2px' }}>
                  {contact.assistantPhone}
                </div>
              </div>
              <div className="contact-channel-actions">
                {contact.assistantWhatsapp && (
                  <a
                    href={getWaLink(contact.assistantWhatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-wa-action"
                  >
                    <MessageCircle size={15} />
                    <span>{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
                  </a>
                )}
                <a
                  href={`tel:${contact.assistantPhone}`}
                  className="btn btn-phone-action"
                >
                  <Phone size={14} />
                  <span>{lang === 'ar' ? 'اتصال' : 'Call'}</span>
                </a>
                <button
                  type="button"
                  className="btn btn-copy-action"
                  onClick={() => handleCopy(contact.assistantPhone, 'asst-phone')}
                  title={t.copyNumber}
                >
                  {copiedKey === 'asst-phone' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Working Hours & Location Strip ── */}
        <div className="contact-meta-strip">
          {contact.workHours && (
            <div className="contact-meta-item">
              <Clock size={15} className="contact-meta-icon" />
              <span>{lang === 'ar' ? contact.workHoursAr : contact.workHours}</span>
            </div>
          )}
          {contact.location && (
            <div className="contact-meta-item">
              <MapPin size={15} className="contact-meta-icon" />
              <span>{lang === 'ar' ? contact.locationAr : contact.location}</span>
            </div>
          )}
        </div>

        {/* ── Social Links ── */}
        {(contact.facebook || contact.telegram) && (
          <div className="contact-social-row">
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {t.socialMedia}:
            </span>
            {contact.facebook && (
              <a
                href={contact.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-social-chip"
              >
                <span>Facebook</span>
                <ExternalLink size={12} />
              </a>
            )}
            {contact.telegram && (
              <a
                href={contact.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-social-chip"
              >
                <span>Telegram</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}

        {/* ── Modal Footer ── */}
        <div className="contact-modal-footer">
          <button
            type="button"
            className="btn btn-outline"
            style={{ width: '100%', color: 'var(--navy-800)', borderColor: 'rgba(37,99,235,0.2)' }}
            onClick={onClose}
          >
            {t.closeModal}
          </button>
        </div>
      </div>
    </div>
  );
}
