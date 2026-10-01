import React from 'react';
import { Globe } from 'lucide-react';
import { translations } from '../utils/i18n';

export default function LanguageToggle({ lang, setLang }) {
  const toggle = () => {
    const nextLang = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
    document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = nextLang;
  };

  const t = translations[lang];

  return (
    <button className="btn btn-outline btn-sm" onClick={toggle} type="button">
      <Globe size={14} />
      <span>{t.langToggle}</span>
    </button>
  );
}
