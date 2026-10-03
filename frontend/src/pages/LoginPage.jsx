import React, { useState, useEffect } from 'react';
import { GraduationCap, ShieldCheck, ArrowRight, ArrowLeft, Camera, ScanLine, BookmarkCheck } from 'lucide-react';
import { verifyParent } from '../services/api';
import { translations } from '../utils/i18n';
import ErrorMessage from '../components/ErrorMessage';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import { getSavedBarcode } from '../utils/cookieAuth';

export default function LoginPage({ onLoginSuccess, lang }) {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const t = translations[lang];

  // Pre-fill barcode from persistent cookie if parent was remembered
  useEffect(() => {
    const saved = getSavedBarcode();
    if (saved) {
      setBarcode(saved);
      setRememberMe(true);
    }
  }, []);

  const doLogin = async (codeToVerify) => {
    const clean = (codeToVerify || '').trim();
    if (!clean) {
      setError(lang === 'ar' ? 'يرجى إدخال أو مسح كود الطالب.' : 'Please enter or scan the Student ID.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await verifyParent(clean);
      if (res.success) {
        sessionStorage.setItem('portal_jwt', res.token);
        sessionStorage.setItem('portal_barcode', res.student.barcode);
        onLoginSuccess(res.student, rememberMe);
      }
    } catch (err) {
      setError(err.response?.data?.message || t.errorLogin);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doLogin(barcode);
  };

  const handleScanSuccess = (scannedCode) => {
    setBarcode(scannedCode);
    doLogin(scannedCode);
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <div className="brand-icon" style={{ width: '56px', height: '56px', borderRadius: '16px' }}>
            <GraduationCap size={32} />
          </div>
        </div>

        <div className="login-header">
          <h1>{t.portalTitle}</h1>
          <p>{t.subTitle}</p>
        </div>

        <ErrorMessage message={error} />

        {/* ── Quick Scan Button (Primary for Mobile) ── */}
        <button
          type="button"
          className="btn btn-scan-banner"
          onClick={() => setIsScannerOpen(true)}
          disabled={loading}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="scan-icon-bubble">
              <Camera size={20} />
            </div>
            <div style={{ textAlign: 'start' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', lineHeight: 1.2 }}>
                {t.scanBarcodeBtn}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>
                {t.cameraInstruction}
              </div>
            </div>
          </div>
          <ScanLine size={18} style={{ opacity: 0.7 }} />
        </button>

        {/* ── Divider ── */}
        <div className="login-divider">
          <span>{t.orDivider}</span>
        </div>

        {/* ── Manual Input Form ── */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t.studentIdLabel}</label>
            <div className="input-scanner-wrapper">
              <input
                type="text"
                className="form-input"
                placeholder={t.studentIdPlaceholder}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                required
                disabled={loading}
                autoComplete="off"
              />
              <button
                type="button"
                className="input-scan-action-btn"
                onClick={() => setIsScannerOpen(true)}
                title={t.scanBarcodeBtn}
                aria-label={t.scanBarcodeBtn}
              >
                <Camera size={18} />
              </button>
            </div>
          </div>

          {/* ── Remember Me ── */}
          <label
            htmlFor="remember-me-checkbox"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '14px',
              cursor: 'pointer',
              fontSize: '13px',
              color: 'var(--text-secondary, #94a3b8)',
              userSelect: 'none',
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '5px',
                border: rememberMe ? '2px solid #6366f1' : '2px solid #475569',
                background: rememberMe ? '#6366f1' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            >
              {rememberMe && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <input
              id="remember-me-checkbox"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ display: 'none' }}
            />
            <BookmarkCheck size={14} style={{ opacity: 0.7 }} />
            <span>
              {lang === 'ar' ? 'تذكرني على هذا الجهاز (30 يوم)' : 'Remember me on this device (30 days)'}
            </span>
          </label>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '12px', padding: '12px' }}
            disabled={loading}
          >
            <span>{loading ? t.loading : t.viewResultsBtn}</span>
            {lang === 'ar' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <ShieldCheck size={14} color="#10b981" />
          <span>Secure • Fast • Available 24/7</span>
        </div>
      </div>

      {/* ── Barcode Scanner Camera Modal ── */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanSuccess}
        lang={lang}
      />
    </div>
  );
}
