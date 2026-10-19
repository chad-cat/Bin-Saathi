import React from 'react';
import { MapPin, BookOpen } from 'lucide-react';
import { Language, i18n } from '../i18n';

interface PlaceholderProps {
  type: 'sites' | 'learn';
  language: Language;
}

export const PlaceholderScreen: React.FC<PlaceholderProps> = ({ type, language }) => {
  const t = i18n[language];
  const isSites = type === 'sites';
  const Icon = isSites ? MapPin : BookOpen;
  const title = isSites ? t.navSites : t.navLearn;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2F3E46]/10 text-[#2F3E46]">
        <Icon className="h-7 w-7 stroke-[1.75]" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-[#1C1C1A]">{title}</h2>
      <p className="mt-1 text-xs text-[#6B6B66]">{t.comingSoonTitle}</p>
      <p className="mt-2 max-w-xs text-xs text-[#6B6B66] leading-relaxed">
        {t.comingSoonDesc}
      </p>
    </div>
  );
};
