import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Search, AlertCircle, Sparkles, ChevronRight, HelpCircle } from 'lucide-react';
import { CATEGORY_COLORS } from '../config';
import { LOCAL_RULES, RuleEntry, searchRules } from '../data/rules';
import { Language, i18n } from '../i18n';
import { Category, ScannedItem } from '../types';

interface ScanScreenProps {
  onImageSelected: (file: File | Blob) => void;
  onRuleItemSelected: (rule: RuleEntry) => void;
  onAskAiText: (query: string) => void;
  onOpenCategoryPicker: () => void;
  onOpenInAppCamera: () => void;
  onRetryLast?: () => void;
  isLoading: boolean;
  loadingMessage?: string;
  errorMessage?: string;
  isQuotaError?: boolean;
  language: Language;
  isOnline: boolean;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({
  onImageSelected,
  onRuleItemSelected,
  onAskAiText,
  onOpenCategoryPicker,
  onOpenInAppCamera,
  onRetryLast,
  isLoading,
  loadingMessage,
  errorMessage,
  isQuotaError,
  language,
  isOnline,
}) => {
  const t = i18n[language];
  const [searchQuery, setSearchQuery] = useState('');
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Local rules search results (runs instantly with no network)
  const searchResults: RuleEntry[] = searchQuery.trim()
    ? searchRules(searchQuery, language).slice(0, 5)
    : [];

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelected(file);
      e.target.value = '';
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelected(file);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full max-w-2xl lg:max-w-3xl mx-auto flex flex-col items-center justify-between pb-24 sm:pb-28 pt-1 sm:pt-3">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleCameraChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleGalleryChange}
        accept="image/*"
        className="hidden"
      />

      {/* Block 1: Search field with instant offline rules matching */}
      <div className="relative w-full">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 sm:left-4 h-4 w-4 sm:h-4.5 sm:w-4.5 text-[#6B6B66]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full rounded-xl border border-[#E6E5E0] bg-white py-2.5 sm:py-3 pl-10 sm:pl-11 pr-11 text-xs sm:text-sm text-[#1C1C1A] placeholder-[#6B6B66] shadow-2xs outline-none transition focus:border-[#2F3E46] focus:ring-1 focus:ring-[#2F3E46] min-h-[44px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 sm:right-2 h-10 w-10 flex items-center justify-center text-xs text-[#6B6B66] hover:text-[#1C1C1A] cursor-pointer"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Search Results Dropdown (Deterministic offline instant results) */}
        {searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-12 sm:top-14 z-20 mt-1 max-h-80 overflow-y-auto rounded-xl border border-[#E6E5E0] bg-white p-2 shadow-lg">
            {searchResults.length > 0 ? (
              <div className="divide-y divide-[#E6E5E0]/60">
                {searchResults.map((rule) => {
                  const ruleCat = rule.category as Category;
                  const catMeta = t.categories[ruleCat] || t.categories.unknown;
                  const catColor = CATEGORY_COLORS[ruleCat] || '#7A7A75';
                  const title = language === 'hi' ? rule.nameHi : rule.nameEn;
                  const subTitle = language === 'hi' ? rule.nameEn : rule.nameHi;

                  return (
                    <button
                      key={rule.itemKey}
                      type="button"
                      onClick={() => {
                        onRuleItemSelected(rule);
                        setSearchQuery('');
                      }}
                      className="flex w-full items-center justify-between p-2.5 sm:p-3 text-left transition hover:bg-[#FAFAF8] rounded-lg group min-h-[48px] cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <span
                          className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: catColor }}
                        />
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-[#1C1C1A]">{title}</div>
                          <div className="text-[11px] sm:text-xs text-[#6B6B66]">
                            {catMeta.binName} • {subTitle}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#6B6B66] group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-xs sm:text-sm text-[#6B6B66]">{t.noLocalMatch}</p>
                {isOnline ? (
                  <button
                    type="button"
                    onClick={() => {
                      onAskAiText(searchQuery);
                      setSearchQuery('');
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#2F3E46] px-4 py-2.5 text-xs sm:text-sm font-medium text-white shadow-2xs hover:bg-[#253238] min-h-[44px] cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{t.askAi}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCategoryPicker();
                      setSearchQuery('');
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-[#E6E5E0] bg-neutral-50 px-4 py-2.5 text-xs sm:text-sm font-medium text-[#1C1C1A] min-h-[44px] cursor-pointer"
                  >
                    {t.pickCategoryManually}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quota or Network Error Banner */}
      {errorMessage && (
        <div className="mt-4 w-full rounded-xl border border-amber-200 bg-amber-50 p-3 sm:p-4 text-xs sm:text-sm text-amber-900 shadow-2xs">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5 flex-1">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-amber-700 mt-0.5" />
              <div>
                <p className="font-medium">
                  {isQuotaError ? t.quotaLimitReached : errorMessage}
                </p>
                <button
                  type="button"
                  onClick={onOpenCategoryPicker}
                  className="mt-1.5 min-h-[40px] inline-flex items-center text-xs sm:text-sm font-semibold text-[#2F3E46] underline cursor-pointer"
                >
                  {t.pickCategoryManually}
                </button>
              </div>
            </div>

            {onRetryLast && !isQuotaError && isOnline && (
              <button
                type="button"
                onClick={onRetryLast}
                disabled={isLoading}
                className="flex items-center justify-center gap-1 rounded-xl border border-[#2F3E46]/30 bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-[#2F3E46] shadow-2xs hover:bg-neutral-50 active:scale-95 disabled:opacity-50 shrink-0 min-h-[44px] cursor-pointer"
              >
                <span>{t.tryAgain}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading state skeleton / spinner */}
      {isLoading ? (
        <div className="my-14 sm:my-20 flex w-full flex-col items-center justify-center space-y-4 py-8 text-center">
          <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[#2F3E46]/10 text-[#2F3E46]">
            <div className="h-7 w-7 sm:h-8 sm:w-8 animate-spin rounded-full border-2 sm:border-3 border-[#2F3E46] border-t-transparent" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-[#1C1C1A]">
              {loadingMessage || t.analyzingImage}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-[#6B6B66]">{t.campusNotice}</p>
          </div>
          {/* Skeleton card */}
          <div className="w-full max-w-sm space-y-2 rounded-xl border border-[#E6E5E0] bg-white p-4 sm:p-5 shadow-xs">
            <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
            <div className="h-8 w-full animate-pulse rounded bg-neutral-100" />
          </div>
        </div>
      ) : (
        /* Block 2: Main Camera Action */
        <div className="my-10 sm:my-14 md:my-16 flex flex-col items-center text-center">
          {/* Large Centred Primary Button */}
          <button
            type="button"
            onClick={onOpenInAppCamera}
            className="group relative flex h-32 w-32 sm:h-36 sm:w-36 md:h-40 md:w-40 items-center justify-center rounded-full bg-[#2F3E46] text-white shadow-lg transition hover:bg-[#253238] active:scale-95 cursor-pointer"
            aria-label={t.takePhoto}
          >
            <div className="flex flex-col items-center">
              <Camera className="h-10 w-10 sm:h-12 sm:w-12 stroke-[1.6] transition group-hover:scale-105" />
              <span className="mt-2 text-xs sm:text-sm font-semibold tracking-wide">{t.takePhoto}</span>
            </div>
          </button>

          {/* Quieter "Choose from gallery" button */}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="mt-4 flex items-center justify-center gap-1.5 px-4 py-2 min-h-[44px] text-xs sm:text-sm font-medium text-[#2F3E46] hover:underline cursor-pointer"
          >
            <ImageIcon className="h-4 w-4" />
            <span>{t.chooseFromGallery}</span>
          </button>

          {/* Sanitary items notice (Section 5.7) */}
          <div className="mt-6 flex flex-col items-center max-w-sm">
            <p className="text-[11px] sm:text-xs text-[#6B6B66]">{t.sanitaryPhotoHint}</p>
            <button
              type="button"
              onClick={onOpenCategoryPicker}
              className="mt-1 min-h-[44px] inline-flex items-center px-3 text-xs sm:text-sm font-medium text-[#2F3E46] underline hover:opacity-80 cursor-pointer"
            >
              {t.pickFromList}
            </button>
          </div>
        </div>
      )}

      {/* Block 3: One-line recent-scan / campus hint */}
      {!isLoading && (
        <div className="w-full text-center mt-auto pt-4">
          <p className="text-[11px] sm:text-xs text-[#6B6B66]">{t.recentScanHint}</p>
          <div className="mt-1 text-[10px] sm:text-[11px] text-[#6B6B66]/80">{t.tagline}</div>
        </div>
      )}
    </div>
  );
};
