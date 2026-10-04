import React from 'react';
import { Camera, MapPin, BookOpen, User } from 'lucide-react';
import { Language, i18n } from '../i18n';

export type TabId = 'scan' | 'sites' | 'learn' | 'me';

interface BottomNavProps {
  activeTab: TabId;
  onChangeTab: (tab: TabId) => void;
  language: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab, language }) => {
  const t = i18n[language];

  const items = [
    { id: 'scan' as TabId, label: t.navScan, icon: Camera },
    { id: 'sites' as TabId, label: t.navSites, icon: MapPin },
    { id: 'learn' as TabId, label: t.navLearn, icon: BookOpen },
    { id: 'me' as TabId, label: t.navMe, icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex justify-center pointer-events-none pb-safe sm:pb-3 md:pb-4 px-0 sm:px-4">
      <div className="pointer-events-auto flex w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl items-center justify-around px-2 sm:px-4 py-1.5 sm:py-2 border-t sm:border border-[#E6E5E0] bg-[#FAFAF8]/95 sm:rounded-2xl shadow-xs sm:shadow-lg backdrop-blur-md transition-all">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`flex flex-1 sm:flex-initial sm:min-w-[100px] flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-xl transition-all min-h-[48px] sm:min-h-[44px] cursor-pointer ${
                isActive
                  ? 'text-[#2F3E46] sm:bg-[#2F3E46]/10 font-semibold'
                  : 'text-[#6B6B66] hover:text-[#1C1C1A] hover:bg-black/[0.03]'
              }`}
              aria-label={item.label}
            >
              <Icon className={`h-5 w-5 sm:h-4.5 sm:w-4.5 stroke-[1.75] shrink-0 ${isActive ? 'stroke-[2.2]' : ''}`} />
              <span
                className={`text-[11px] sm:text-xs leading-tight whitespace-nowrap ${
                  isActive ? 'font-semibold' : 'font-normal'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
