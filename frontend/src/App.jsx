import React, { useState, useEffect } from 'react';
import { GraduationCap } from 'lucide-react';
import LoginPage from './pages/LoginPage';
import ResultsPage from './pages/ResultsPage';
import LanguageToggle from './components/LanguageToggle';
import { translations } from './utils/i18n';
import { saveBarcodeToookie, getSavedBarcode, clearSavedBarcode } from './utils/cookieAuth';
import { TEACHER } from './utils/teacher';

export default function App() {
  const [lang, setLang] = useState('ar');
  const [student, setStudent] = useState(null);
  const [barcode, setBarcode] = useState('');

  const t = translations[lang];

  useEffect(() => {
    // Set initial dir attribute for html
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;

    // 1) Try sessionStorage first (same-tab active session)
    const savedToken   = sessionStorage.getItem('portal_jwt');
    const savedBarcode = sessionStorage.getItem('portal_barcode');
    if (savedToken && savedBarcode) {
      setBarcode(savedBarcode);
      setStudent({ barcode: savedBarcode });
      return;
    }
    // 2) Fall back to persistent cookie (remembered barcode)
    const cookieBarcode = getSavedBarcode();
    if (cookieBarcode) {
      setBarcode(cookieBarcode);
      setStudent({ barcode: cookieBarcode });
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
              {lang === 'ar' ? `${TEACHER.nameAr} • ${TEACHER.subjectAr}` : `${TEACHER.name} • ${TEACHER.subject}`}
            </span>
          </div>
        </div>
        <LanguageToggle lang={lang} setLang={setLang} />
      </header>

      {/* ── Page Content ── */}
      {student && barcode ? (
        <ResultsPage barcode={barcode} onLogout={handleLogout} lang={lang} />
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} lang={lang} />
      )}

      {/* ── Footer ── */}
      <footer className="footer">
        <p>
          {lang === 'ar'
            ? `جميع الحقوق محفوظة © ${TEACHER.nameAr} — ${TEACHER.subjectAr}`
            : `All rights reserved © ${TEACHER.name} — ${TEACHER.subject}`}
        </p>
      </footer>

      {/* ── Teacher Floating Badge ── */}
      <div
        className="teacher-badge"
        title={lang === 'ar' ? `${TEACHER.nameAr} - ${TEACHER.subjectAr}` : `${TEACHER.name} - ${TEACHER.subject}`}
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
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1034a6, #2563eb)',
            color: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '15px',
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
            {lang === 'ar' ? TEACHER.subjectAr : TEACHER.subject}
          </span>
        </div>
      </div>
    </div>
  );
}
