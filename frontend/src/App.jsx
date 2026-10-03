import React, { useState, useEffect } from 'react';
import { GraduationCap, MessageCircle, Phone } from 'lucide-react';
import LoginPage from './pages/LoginPage';
import ResultsPage from './pages/ResultsPage';
import LanguageToggle from './components/LanguageToggle';
import ContactModal from './components/ContactModal';
import { translations } from './utils/i18n';
import { saveBarcodeToookie, getSavedBarcode, clearSavedBarcode } from './utils/cookieAuth';
import { TEACHER } from './utils/teacher';

export default function App() {
  const [lang, setLang] = useState('ar');
  const [student, setStudent] = useState(null);
  const [barcode, setBarcode] = useState('');
  const [contactOpen, setContactOpen] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;

    // 1) Active session in sessionStorage (has JWT already) — restore immediately
    const savedToken   = sessionStorage.getItem('portal_jwt');
    const savedBarcode = sessionStorage.getItem('portal_barcode');
    if (savedToken && savedBarcode) {
      setBarcode(savedBarcode);
      setStudent({ barcode: savedBarcode });
      return;
    }

    // 2) Cookie-remembered barcode: re-verify to get a fresh JWT.
    //    We cannot skip verification — the results API requires a valid token.
    const cookieBarcode = getSavedBarcode();
    if (cookieBarcode) {
      import('./services/api').then(({ verifyParent }) => {
        verifyParent(cookieBarcode)
          .then((res) => {
            if (res.success) {
              sessionStorage.setItem('portal_jwt', res.token);
              sessionStorage.setItem('portal_barcode', res.student.barcode);
              setBarcode(res.student.barcode);
              setStudent(res.student);
            } else {
              // Token invalid / student removed — clear stale cookie
              clearSavedBarcode();
            }
          })
          .catch(() => {
            // Network error or student not found — clear stale cookie silently
            clearSavedBarcode();
          });
      });
    }
  }, []);


  const handleLoginSuccess = (studentData, remember) => {
    setStudent(studentData);
    setBarcode(studentData.barcode);
    if (remember) saveBarcodeToookie(studentData.barcode);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('portal_jwt');
    sessionStorage.removeItem('portal_barcode');
    clearSavedBarcode();
    setStudent(null);
    setBarcode('');
  };

  const waLink = (() => {
    const phone = TEACHER.contact?.whatsapp || '';
    const clean = phone.replace(/\D/g, '');
    const full  = clean.startsWith('0') ? `2${clean}` : clean;
    const msg   = lang === 'ar'
      ? 'السلام عليكم، أود الاستفسار بخصوص بوابة الطالب.'
      : 'Hello, I would like to inquire about the student portal.';
    return `https://wa.me/${full}?text=${encodeURIComponent(msg)}`;
  })();

  return (
    <div className="app-container">
      {/* ── Navbar ── */}
      <header className="navbar">
        <div className="brand-logo">
          <div className="brand-icon">
            <GraduationCap size={21} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontWeight: 800, fontSize: '15px' }}>{t.portalTitle}</span>
            <span style={{ fontSize: '11px', color: 'var(--navy-300)', fontWeight: 600 }}>
              {lang === 'ar'
                ? `${TEACHER.nameAr} • ${TEACHER.subjectAr}`
                : `${TEACHER.name} • ${TEACHER.subject}`}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Contact Us Button */}
          <button
            type="button"
            className="btn-contact-nav"
            onClick={() => setContactOpen(true)}
            aria-label={t.contactUs}
          >
            <MessageCircle size={15} />
            <span>{t.contactUs}</span>
          </button>
          <LanguageToggle lang={lang} setLang={setLang} />
        </div>
      </header>

      {/* ── Page Content ── */}
      {student && barcode ? (
        <ResultsPage barcode={barcode} onLogout={handleLogout} lang={lang} />
      ) : (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          lang={lang}
          onContactOpen={() => setContactOpen(true)}
        />
      )}

      {/* ── Footer ── */}
      <footer className="footer">
        <p>
          {lang === 'ar'
            ? `جميع الحقوق محفوظة © ${TEACHER.nameAr} — ${TEACHER.subjectAr}`
            : `All rights reserved © ${TEACHER.name} — ${TEACHER.subject}`}
        </p>
        <div className="footer-contact-links">
          <button
            type="button"
            className="footer-contact-link"
            onClick={() => setContactOpen(true)}
          >
            <MessageCircle size={13} />
            <span>{t.contactUs}</span>
          </button>
          {TEACHER.contact?.whatsapp && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-contact-link"
            >
              <Phone size={13} />
              <span>{lang === 'ar' ? 'واتساب مباشر' : 'WhatsApp'}</span>
            </a>
          )}
        </div>
      </footer>

      {/* ── Teacher Floating Badge — click to open Contact ── */}
      <button
        type="button"
        className="teacher-badge"
        onClick={() => setContactOpen(true)}
        title={lang === 'ar'
          ? `${TEACHER.nameAr} — ${t.contactUs}`
          : `${TEACHER.name} — ${t.contactUs}`}
        aria-label={t.contactUs}
      >
        <img
          src={TEACHER.photo}
          alt={TEACHER.name}
          className="teacher-badge-photo"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextElementSibling) {
              e.currentTarget.nextElementSibling.style.display = 'flex';
            }
          }}
        />
        {/* Initials fallback */}
        <div
          style={{
            display: 'none',
            width: '44px', height: '44px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1034a6, #2563eb)',
            color: '#fff',
            alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '15px',
            border: '2px solid #3b82f6',
            flexShrink: 0,
          }}
        >
          {TEACHER.initials}
        </div>
        <div className="teacher-badge-info">
          <span className="teacher-badge-name">
            {lang === 'ar' ? TEACHER.nameAr : TEACHER.name}
          </span>
          <span className="teacher-badge-subject">
            {lang === 'ar' ? t.contactUs : t.contactUs}
          </span>
        </div>
      </button>

      {/* ── Contact Modal ── */}
      <ContactModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        lang={lang}
      />
    </div>
  );
}
