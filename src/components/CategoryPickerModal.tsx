import React from 'react';
import { X, ChevronRight } from 'lucide-react';
import { CATEGORY_COLORS } from '../config';
import { Language, i18n } from '../i18n';
import { Category } from '../types';

interface CategoryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: Category) => void;
  language: Language;
}

const CATEGORY_ORDER: Category[] = [
  'wet',
  'dry',
  'sanitary',
  'special_care',
  'e_waste',
  'battery',
  'horticulture',
  'c_and_d',
  'biomedical',
  'hazardous',
  'reuse_donate',
];

export const CategoryPickerModal: React.FC<CategoryPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
  language,
}) => {
  if (!isOpen) return null;

  const t = i18n[language];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-xs">
      <div className="flex max-h-[85vh] w-full max-w-md sm:max-w-lg flex-col rounded-t-2xl sm:rounded-2xl border border-[#E6E5E0] bg-[#FAFAF8] p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E6E5E0]">
          <h2 className="text-base sm:text-lg font-semibold text-[#1C1C1A]">
            {t.selectCorrectCategory}
          </h2>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl p-2 text-[#6B6B66] hover:bg-neutral-200/50 cursor-pointer min-h-[44px] min-w-[44px]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto py-2 divide-y divide-[#E6E5E0]/60">
          {CATEGORY_ORDER.map((cat) => {
            const catInfo = t.categories[cat];
            const color = CATEGORY_COLORS[cat];

            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  onSelectCategory(cat);
                  onClose();
                }}
                className="flex w-full items-center justify-between py-3.5 px-3 text-left transition hover:bg-white rounded-xl group min-h-[48px] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <div>
                    <div className="text-sm font-medium text-[#1C1C1A]">{catInfo.label}</div>
                    <div className="text-xs text-[#6B6B66]">{catInfo.binName}</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#6B6B66] group-hover:translate-x-0.5 transition-transform" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
