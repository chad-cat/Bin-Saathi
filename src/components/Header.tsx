import React from 'react';
import { WifiOff } from 'lucide-react';
import { Language, i18n } from '../i18n';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({ language, onLanguageChange, isOnline }) => {
  const t = i18n[language];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#E6E5E0] bg-[#FAFAF8]/95 px-3.5 sm:px-6 md:px-8 py-2.5 sm:py-3.5 backdrop-blur-sm">
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <h1 className="text-base sm:text-lg md:text-xl font-semibold tracking-tight text-[#1C1C1A]">
            {t.appName}
          </h1>
          <span className="rounded bg-[#2F3E46]/10 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium tracking-wide text-[#2F3E46]">
            IITR
          </span>
        </div>
        <p className="text-[11px] sm:text-xs text-[#6B6B66] line-clamp-1">{t.appSubtitle}</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {!isOnline && (
          <div
            className="flex items-center gap-1.5 rounded-lg border border-[#E6E5E0] bg-amber-50 px-2 sm:px-2.5 py-1 sm:py-1.5 text-[11px] sm:text-xs text-amber-800"
            title={t.offlineNotice}
          >
            <WifiOff className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Offline</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => onLanguageChange(language === 'en' ? 'hi' : 'en')}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#E6E5E0] bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-[#1C1C1A] shadow-2xs transition hover:bg-neutral-50 active:scale-95 cursor-pointer"
          aria-label="Toggle language between English and Hindi"
        >
          <span className={language === 'en' ? 'font-bold text-[#2F3E46]' : 'text-[#6B6B66]'}>
            EN
          </span>
          <span className="mx-1 text-[#6B6B66]">|</span>
          <span
            className={`${
              language === 'hi' ? 'font-bold text-[#2F3E46]' : 'text-[#6B6B66]'
            } font-devanagari`}
          >
            हिं
          </span>
        </button>
      </div>
    </header>
  );
};
