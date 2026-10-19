import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, AlertCircle, Check } from 'lucide-react';
import { CATEGORY_COLORS } from '../config';
import { LOCAL_RULES } from '../data/rules';
import { Language, i18n } from '../i18n';
import { Category, ScanFeedback, ScannedItem } from '../types';

interface CorrectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentItem: ScannedItem;
  onSaveCorrection: (feedback: ScanFeedback) => void;
  language: Language;
}

const CORE_CATEGORIES: Category[] = ['wet', 'dry', 'sanitary', 'special_care'];

const EXTENDED_CATEGORIES: Category[] = [
  'e_waste',
  'battery',
  'horticulture',
  'c_and_d',
  'biomedical',
  'hazardous',
  'reuse_donate',
];

export const CorrectionSheet: React.FC<CorrectionSheetProps> = ({
  isOpen,
  onClose,
  currentItem,
  onSaveCorrection,
  language,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>(currentItem.category);
  const [customName, setCustomName] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [showExtended, setShowExtended] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  if (!isOpen) return null;

  const t = i18n[language];

  const handleSelectCategory = (cat: Category) => {
    setSelectedCategory(cat);
    setConflictWarning(null);
  };

  const handleSaveAttempt = (force: boolean = false) => {
    // Check if the choice conflicts with the statutory rules table
    const ruleMatch = LOCAL_RULES[currentItem.itemKey];
    if (!force && ruleMatch && ruleMatch.category !== selectedCategory) {
      const matchCat = ruleMatch.category as Category;
      const expectedCatLabel = t.categories[matchCat]?.label || matchCat;
      setConflictWarning(expectedCatLabel);
      return;
    }

    const conflictsWithRules = Boolean(ruleMatch && ruleMatch.category !== selectedCategory);

    const feedback: ScanFeedback = {
      confirmed: false,
      correctedCategory: selectedCategory,
      correctedName: customName.trim() || undefined,
      note: note.trim() || undefined,
      conflictsWithRules,
    };

    onSaveCorrection(feedback);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
      <div className="flex max-h-[90vh] w-full max-w-md sm:max-w-lg md:max-w-xl flex-col rounded-t-2xl sm:rounded-2xl border border-[#E6E5E0] bg-[#FAFAF8] p-4 sm:p-6 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E6E5E0]">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-[#1C1C1A]">{t.correctTitle}</h2>
            <p className="text-xs sm:text-sm text-[#6B6B66]">
              {language === 'hi' ? currentItem.nameHi : currentItem.nameEn}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl p-2 text-[#6B6B66] hover:bg-neutral-200/50 cursor-pointer min-h-[44px] min-w-[44px]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conflict Warning Dialog if rules differ */}
        {conflictWarning ? (
          <div className="my-4 rounded-xl border border-amber-300 bg-amber-50/80 p-4">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-amber-900">{t.conflictWarningTitle}</h3>
                <p className="mt-1 text-xs sm:text-sm text-amber-800">
                  {t.conflictWarningBody(conflictWarning)}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveAttempt(true)}
                    className="flex-1 rounded-xl bg-amber-800 px-4 py-3 text-xs sm:text-sm font-semibold text-white transition hover:bg-amber-900 active:scale-95 min-h-[44px] cursor-pointer"
                  >
                    {t.saveAnyway}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConflictWarning(null)}
                    className="rounded-xl border border-amber-300 bg-white px-4 py-3 text-xs sm:text-sm font-medium text-amber-900 hover:bg-amber-50 min-h-[44px] cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Step 1: Select Category */}
            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#6B6B66]">
                {t.selectCorrectCategory}
              </label>

              {/* 4 Core SWM Rules streams as large distinct buttons */}
              <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CORE_CATEGORIES.map((cat) => {
                  const catInfo = t.categories[cat];
                  const isSelected = selectedCategory === cat;
                  const color = CATEGORY_COLORS[cat];

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      className={`flex flex-col items-start rounded-xl border p-3 text-left transition min-h-[56px] cursor-pointer ${
                        isSelected
                          ? 'border-[#2F3E46] bg-white shadow-xs'
                          : 'border-[#E6E5E0] bg-white/60 hover:bg-white'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        {isSelected && <Check className="h-3.5 w-3.5 text-[#2F3E46]" />}
                      </div>
                      <span className="mt-1.5 text-xs font-medium text-[#1C1C1A]">
                        {catInfo.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Extended streams accordion toggle */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowExtended(!showExtended)}
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#2F3E46] py-2 hover:underline cursor-pointer min-h-[40px]"
                >
                  {showExtended ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      <span>{t.fewerCategories}</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      <span>{t.moreCategories}</span>
                    </>
                  )}
                </button>

                {showExtended && (
                  <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {EXTENDED_CATEGORIES.map((cat) => {
                      const catInfo = t.categories[cat];
                      const isSelected = selectedCategory === cat;
                      const color = CATEGORY_COLORS[cat];

                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleSelectCategory(cat)}
                          className={`flex flex-col items-start rounded-xl border p-3 text-left transition min-h-[56px] cursor-pointer ${
                            isSelected
                              ? 'border-[#2F3E46] bg-white shadow-xs'
                              : 'border-[#E6E5E0] bg-white/60 hover:bg-white'
                          }`}
                        >
                          <div className="flex w-full items-center justify-between">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            {isSelected && <Check className="h-3.5 w-3.5 text-[#2F3E46]" />}
                          </div>
                          <span className="mt-1 text-xs font-medium text-[#1C1C1A]">
                            {catInfo.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Optional name and note */}
            <div className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs sm:text-sm font-medium text-[#6B6B66]">
                  {t.optionalItemName}
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={language === 'hi' ? currentItem.nameHi : currentItem.nameEn}
                  className="mt-1.5 w-full rounded-xl border border-[#E6E5E0] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#1C1C1A] outline-none focus:border-[#2F3E46] min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-[#6B6B66]">{t.optionalNote}</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Broken glass wrapped in cardboard"
                  className="mt-1.5 w-full rounded-xl border border-[#E6E5E0] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#1C1C1A] outline-none focus:border-[#2F3E46] min-h-[44px]"
                />
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="mt-6 flex gap-2.5">
              <button
                type="button"
                onClick={() => handleSaveAttempt(false)}
                className="flex-1 rounded-xl bg-[#2F3E46] py-3.5 px-4 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-[#253238] active:scale-[0.98] min-h-[44px] cursor-pointer"
              >
                {t.saveCorrection}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#E6E5E0] bg-white px-5 py-3.5 text-xs sm:text-sm font-medium text-[#1C1C1A] hover:bg-neutral-50 min-h-[44px] cursor-pointer"
              >
                {t.cancel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
