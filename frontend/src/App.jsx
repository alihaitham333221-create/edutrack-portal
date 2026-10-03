import React, { useState, useEffect } from 'react';
import { GraduationCap } from 'lucide-react';
import LoginPage from './pages/LoginPage';
import ResultsPage from './pages/ResultsPage';
import LanguageToggle from './components/LanguageToggle';
import { translations } from './utils/i18n';
import { saveBarcodeToookie, getSavedBarcode, clearSavedBarcode } from './utils/cookieAuth';

export default function App() {
  const [lang, setLang] = useState('ar');
  const [student, setStudent] = useState(null);
  const [barcode, setBarcode] = useState('');

  const t = translations[lang];

  useEffect(() => {
    // 1) Try sessionStorage first (same-tab session)
    const savedToken = sessionStorage.getItem('portal_jwt');
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
    if (remember) {
      saveBarcodeToookie(studentData.barcode);
    }
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
      <header className="navbar">
        <div className="brand-logo">
          <div className="brand-icon">
            <GraduationCap size={22} />
          </div>
          <span>{t.portalTitle}</span>
        </div>

        <LanguageToggle lang={lang} setLang={setLang} />
      </header>

      {student && barcode ? (
        <ResultsPage barcode={barcode} onLogout={handleLogout} lang={lang} />
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} lang={lang} />
      )}

      <footer className="footer">
        <p>{t.footerText}</p>
      </footer>
    </div>
  );
}
