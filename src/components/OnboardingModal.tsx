import React, { useState } from 'react';
import { ShieldCheck, Camera, AlertTriangle } from 'lucide-react';
import { Language, i18n } from '../i18n';

interface OnboardingModalProps {
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  onComplete: (dontShowAgain: boolean) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  language,
  onSelectLanguage,
  onComplete,
}) => {
  const [step, setStep] = useState<'lang' | 'privacy'>('lang');
  const [dontShowAgain, setDontShowAgain] = useState(true);

  const t = i18n[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm sm:max-w-md rounded-2xl border border-[#E6E5E0] bg-[#FAFAF8] p-5 sm:p-7 shadow-2xl">
        {step === 'lang' ? (
          <div className="flex flex-col items-center text-center">
            <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-[#2F3E46]/10 text-[#2F3E46]">
              <ShieldCheck className="h-7 w-7 stroke-[1.8]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1C1C1A]">{t.welcomeTitle}</h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#6B6B66]">{t.welcomeSubtitle}</p>
            <p className="mt-4 text-xs sm:text-sm font-medium text-[#1C1C1A]">Select your preferred language / भाषा चुनें:</p>

            <div className="mt-4 flex w-full gap-3">
              <button
                type="button"
                onClick={() => onSelectLanguage('en')}
                className={`flex-1 rounded-xl border py-3 px-3 text-sm font-medium transition min-h-[48px] cursor-pointer ${
                  language === 'en'
                    ? 'border-[#2F3E46] bg-[#2F3E46] text-white shadow-xs'
                    : 'border-[#E6E5E0] bg-white text-[#1C1C1A] hover:bg-neutral-50'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => onSelectLanguage('hi')}
                className={`flex-1 rounded-xl border py-3 px-3 text-sm font-medium transition min-h-[48px] cursor-pointer ${
                  language === 'hi'
                    ? 'border-[#2F3E46] bg-[#2F3E46] text-white shadow-xs'
                    : 'border-[#E6E5E0] bg-white text-[#1C1C1A] hover:bg-neutral-50'
                }`}
              >
                हिन्दी
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep('privacy')}
              className="mt-6 w-full rounded-xl bg-[#2F3E46] py-3.5 text-sm font-semibold text-white transition hover:bg-[#253238] active:scale-[0.98] min-h-[48px] cursor-pointer"
            >
              {t.continueBtn}
            </button>
          </div>
        ) : (
          <div className="flex flex-col text-left">
            <div className="mb-2.5 flex items-center gap-2 text-[#2F3E46]">
              <Camera className="h-5 w-5" />
              <h2 className="text-base sm:text-lg font-semibold text-[#1C1C1A]">{t.privacyNoticeTitle}</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#6B6B66] leading-relaxed">{t.privacyNoticeBody}</p>

            <div className="mt-3.5 space-y-2.5 rounded-xl border border-[#E6E5E0] bg-white p-3.5 text-xs sm:text-sm text-[#1C1C1A]">
              <div className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2F3E46]" />
                <span>{t.privacyNoticeBullet1}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2F3E46]" />
                <span>{t.privacyNoticeBullet2}</span>
              </div>
              <div className="flex items-start gap-2 text-amber-900">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                <span className="font-medium">{t.privacyNoticeBullet3}</span>
              </div>
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-xs sm:text-sm text-[#6B6B66] min-h-[44px]">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="h-4 w-4 rounded border-[#E6E5E0] accent-[#2F3E46]"
              />
              <span>{t.dontShowAgain}</span>
            </label>

            <button
              type="button"
              onClick={() => onComplete(dontShowAgain)}
              className="mt-4 w-full rounded-xl bg-[#2F3E46] py-3.5 text-sm font-semibold text-white transition hover:bg-[#253238] active:scale-[0.98] min-h-[48px] cursor-pointer"
            >
              {t.getStarted}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
