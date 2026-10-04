import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  Info,
  ShieldCheck,
  RotateCcw,
  MapPin,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { CATEGORY_COLORS } from '../config';
import { Language, i18n } from '../i18n';
import { calculateDistanceMeters } from '../lib/georef';
import { storageService } from '../services/storage';
import { Category, ScanFeedback, ScanRecord, ScannedItem, Site } from '../types';

interface ResultViewProps {
  items: ScannedItem[];
  thumbnail?: string;
  source: 'photo' | 'text';
  language: Language;
  onConfirmFeedback: (itemId: string) => void;
  onOpenCorrection: (item: ScannedItem) => void;
  onSelectAlternative: (itemIndex: number, newCategory: Category) => void;
  onResetScan: () => void;
  feedback?: ScanFeedback;
  userCoords?: [number, number] | null;
  onOpenSitesCategory?: (category: Category) => void;
  onOpenAddSite?: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  items,
  thumbnail,
  language,
  onConfirmFeedback,
  onOpenCorrection,
  onSelectAlternative,
  onResetScan,
  feedback,
  userCoords,
  onOpenSitesCategory,
  onOpenAddSite,
}) => {
  const t = i18n[language];
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  // Accordion open states
  const [openWhy, setOpenWhy] = useState(false);
  const [openCouldBe, setOpenCouldBe] = useState(false);
  const [openRoute, setOpenRoute] = useState(false);

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Info className="h-8 w-8 text-[#6B6B66]" />
        <h2 className="mt-2 text-base font-semibold text-[#1C1C1A]">{t.notWasteTitle}</h2>
        <p className="mt-1 text-xs text-[#6B6B66]">{t.notWasteDesc}</p>
        <button
          type="button"
          onClick={onResetScan}
          className="mt-4 rounded-xl bg-[#2F3E46] px-4 py-2.5 text-xs font-medium text-white shadow-xs hover:bg-[#253238]"
        >
          {t.retakePhoto}
        </button>
      </div>
    );
  }

  const currentItem = items[activeItemIndex] || items[0];
  const activeCategory = feedback?.correctedCategory || currentItem.category;
  const categoryMeta = t.categories[activeCategory] || t.categories.unknown;
  const catColor = CATEGORY_COLORS[activeCategory] || '#7A7A75';

  // Confidence calculations
  const confScore = Math.round(currentItem.confidence * 100);
  let confBand = t.confMed;
  if (currentItem.confidence >= 0.8) confBand = t.confHigh;
  else if (currentItem.confidence < 0.55) confBand = t.confLow;

  const isLowConfidence = currentItem.confidence < 0.55;

  // Precaution rule: if chosen category is not hazardous but any alternative in hazardous streams has p >= 0.20
  const hazardousStreams: Category[] = [
    'battery',
    'e_waste',
    'special_care',
    'sanitary',
    'hazardous',
    'biomedical',
  ];
  const cautionAlt = currentItem.alternatives.find(
    (alt) => !hazardousStreams.includes(activeCategory) && hazardousStreams.includes(alt.category) && alt.p >= 0.2
  );

  // Find nearest drop-off site on campus that accepts this stream
  const allSites = storageService.getSites();
  const matchingSites = allSites.filter((s) => s.accepts.includes(activeCategory));

  let nearestSite: Site | null = null;
  let nearestDist: number | null = null;

  if (matchingSites.length > 0) {
    const refLat = userCoords ? userCoords[0] : 29.865;
    const refLng = userCoords ? userCoords[1] : 77.897;

    let minDist = Infinity;
    for (const s of matchingSites) {
      if (s.latlng) {
        const d = calculateDistanceMeters(refLat, refLng, s.latlng[0], s.latlng[1]);
        if (d < minDist) {
          minDist = d;
          nearestSite = s;
        }
      }
    }
    nearestDist = minDist !== Infinity ? minDist : 120;
    if (!nearestSite) nearestSite = matchingSites[0];
  }

  return (
    <div className="w-full max-w-3xl lg:max-w-4xl mx-auto flex flex-col space-y-4 pb-24 sm:pb-28 pt-1">
      {/* Multi-item selector tabs if > 1 item was identified */}
      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {items.map((item, idx) => {
            const isActive = idx === activeItemIndex;
            const itemCatColor = CATEGORY_COLORS[item.category] || '#7A7A75';
            const name = language === 'hi' ? item.nameHi : item.nameEn;

            return (
              <button
                key={item.itemKey + idx}
                type="button"
                onClick={() => {
                  setActiveItemIndex(idx);
                  setOpenWhy(false);
                  setOpenCouldBe(false);
                  setOpenRoute(false);
                }}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm transition min-h-[44px] cursor-pointer ${
                  isActive
                    ? 'border-[#2F3E46] bg-white shadow-xs font-semibold'
                    : 'border-[#E6E5E0] bg-white/50 text-[#6B6B66] hover:bg-white'
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: itemCatColor }}
                />
                <span className="font-medium text-[#1C1C1A]">{name}</span>
                <span className="text-[10px] sm:text-xs text-[#6B6B66]">
                  {Math.round(item.confidence * 100)}%
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Result Card */}
      <div
        className="relative overflow-hidden rounded-2xl border border-[#E6E5E0] bg-white p-4 sm:p-6 shadow-xs"
        style={{ borderLeftWidth: '5px', borderLeftColor: catColor }}
      >
        {/* 1. Thumbnail + Item Names + Rescan */}
        <div className="flex items-start justify-between gap-3 border-b border-[#E6E5E0]/70 pb-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {thumbnail && (
              <img
                src={thumbnail}
                alt="Waste Item"
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl border border-[#E6E5E0] object-cover shrink-0"
              />
            )}
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-[#1C1C1A]">
                {feedback?.correctedName || (language === 'hi' ? currentItem.nameHi : currentItem.nameEn)}
              </h2>
              <p className="text-xs sm:text-sm text-[#6B6B66]">
                {language === 'hi' ? currentItem.nameEn : currentItem.nameHi}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onResetScan}
            className="flex items-center gap-1.5 rounded-xl border border-[#E6E5E0] px-3 py-2 text-xs sm:text-sm font-medium text-[#6B6B66] hover:bg-neutral-50 active:scale-95 min-h-[44px] cursor-pointer shrink-0"
            title="Scan another item"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.navScan}</span>
          </button>
        </div>

        {/* 2-Column Responsive Body: Single column on mobile, Two columns on tablet/desktop */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 md:gap-6 items-start">
          {/* Left Column: Destination, Confidence, Feedback */}
          <div className="space-y-4">
            {/* Clear destination box */}
            <div className="rounded-xl border border-[#E6E5E0]/80 bg-[#FAFAF8] p-3.5 sm:p-4">
              <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#6B6B66]">
                {t.putIn}
              </div>
              <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                <span className="text-lg sm:text-xl font-bold text-[#1C1C1A]">{categoryMeta.binName}</span>
                <span className="text-xs sm:text-sm font-medium text-[#6B6B66]">({categoryMeta.label})</span>
              </div>

              {/* Overridden by rules notification */}
              {currentItem.overriddenByRules && (
                <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-800">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>{t.overriddenNote}</span>
                </div>
              )}

              {/* Precaution warning banner */}
              {cautionAlt && (
                <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-900">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    {t.couldAlsoBe.replace(
                      '{category}',
                      t.categories[cautionAlt.category]?.label || cautionAlt.category
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Confidence Bar & Help Text (Section 5.5) */}
            <div className="space-y-1.5 rounded-xl border border-[#E6E5E0]/60 bg-white p-3.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-[#6B6B66]">
                  {t.confidence}: <strong className="text-[#1C1C1A]">{confBand} ({confScore}%)</strong>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${confScore}%`,
                    backgroundColor: catColor,
                  }}
                />
              </div>
              <p className="text-[11px] sm:text-xs text-[#6B6B66]">{t.confidenceHelp}</p>
            </div>

            {/* Low Confidence Candidate Chips (5.5) */}
            {isLowConfidence && currentItem.alternatives.length > 0 && (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:p-3.5">
                <p className="text-xs sm:text-sm font-medium text-[#1C1C1A]">{t.whichLooksRight}</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {currentItem.alternatives.slice(0, 3).map((alt) => (
                    <button
                      key={alt.category}
                      type="button"
                      onClick={() => onSelectAlternative(activeItemIndex, alt.category)}
                      className="rounded-full border border-[#E6E5E0] bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-[#1C1C1A] shadow-2xs hover:bg-neutral-100 active:scale-95 min-h-[44px] flex items-center cursor-pointer"
                    >
                      {t.categories[alt.category]?.label || alt.name} ({Math.round(alt.p * 100)}%)
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer: "Was this right?" */}
            <div className="rounded-xl border border-[#E6E5E0] bg-white p-3.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-medium text-[#6B6B66]">{t.wasThisRight}</span>

                {feedback ? (
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-emerald-800">
                    <Check className="h-4 w-4" />
                    <span>
                      {feedback.confirmed
                        ? t.yes
                        : `${feedback.correctedCategory ? t.categories[feedback.correctedCategory]?.label : 'Corrected'}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenCorrection(currentItem)}
                      className="ml-2 min-h-[44px] px-2 inline-flex items-center text-xs sm:text-sm font-semibold text-[#2F3E46] underline hover:opacity-80 cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onConfirmFeedback(currentItem.itemKey)}
                      className="rounded-xl border border-[#E6E5E0] bg-white px-4 py-2 text-xs sm:text-sm font-medium text-[#1C1C1A] hover:bg-neutral-50 active:scale-95 min-h-[44px] cursor-pointer"
                    >
                      {t.yes}
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenCorrection(currentItem)}
                      className="rounded-xl border border-[#2F3E46]/30 bg-white px-4 py-2 text-xs sm:text-sm font-medium text-[#2F3E46] hover:bg-neutral-50 active:scale-95 min-h-[44px] cursor-pointer"
                    >
                      {t.noCorrectIt}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Steps, Nearest Site, Accordions */}
          <div className="space-y-4 mt-4 md:mt-0">
            {/* How to dispose: Up to 3 short steps */}
            <div className="rounded-xl border border-[#E6E5E0]/70 bg-white p-3.5 sm:p-4">
              <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#6B6B66]">
                {t.howToDispose}
              </h3>
              <ul className="mt-2.5 space-y-2.5">
                {currentItem.steps.slice(0, 3).map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#1C1C1A]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2F3E46]/10 text-xs font-bold text-[#2F3E46] mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Nearest Drop-Off Chip */}
            <div>
              {nearestSite ? (
                <button
                  type="button"
                  onClick={() => onOpenSitesCategory?.(activeCategory)}
                  className="flex items-center justify-between w-full rounded-xl border border-[#E6E5E0] bg-[#FAFAF8] p-3.5 text-xs sm:text-sm text-[#1C1C1A] hover:bg-neutral-100 transition shadow-2xs group min-h-[48px] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-[#2F3E46] shrink-0" />
                    <span className="font-medium text-left">
                      {t.nearestDropOffPrefix}{' '}
                      <strong className="text-[#2F3E46] font-semibold">{nearestSite.name}</strong>,{' '}
                      {nearestDist != null ? t.distanceApprox(nearestDist) : ''}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#6B6B66] group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              ) : (
                <div className="flex items-center justify-between w-full rounded-xl border border-dashed border-[#E6E5E0] bg-[#FAFAF8] p-3.5 text-xs sm:text-sm min-h-[48px]">
                  <div className="flex items-center gap-2 text-[#6B6B66]">
                    <MapPin className="h-4 w-4 shrink-0 text-[#6B6B66]" />
                    <span>{t.noDropOffForCategory(categoryMeta.label)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenAddSite}
                    className="font-semibold text-[#2F3E46] underline hover:opacity-80 ml-2 shrink-0 min-h-[44px] inline-flex items-center cursor-pointer"
                  >
                    + {t.addSite}
                  </button>
                </div>
              )}
            </div>

            {/* Collapsed Accordions */}
            <div className="rounded-xl border border-[#E6E5E0] bg-white divide-y divide-[#E6E5E0]/60 overflow-hidden">
              {/* Accordion: Why this category */}
              <div className="p-3 sm:p-3.5">
                <button
                  type="button"
                  onClick={() => setOpenWhy(!openWhy)}
                  className="flex w-full items-center justify-between text-left text-xs sm:text-sm font-medium text-[#2F3E46] min-h-[36px] cursor-pointer"
                >
                  <span>{t.whyThisCategory}</span>
                  {openWhy ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 text-[#6B6B66]" />}
                </button>
                {openWhy && (
                  <div className="mt-2 rounded-lg bg-[#FAFAF8] p-3 text-xs sm:text-sm text-[#1C1C1A] leading-relaxed border border-[#E6E5E0]">
                    <p>{currentItem.why || categoryMeta.basis}</p>
                    <p className="mt-1.5 text-xs text-[#6B6B66]">{categoryMeta.basis}</p>
                  </div>
                )}
              </div>

              {/* Accordion: Could also be */}
              {currentItem.alternatives.length > 0 && (
                <div className="p-3 sm:p-3.5">
                  <button
                    type="button"
                    onClick={() => setOpenCouldBe(!openCouldBe)}
                    className="flex w-full items-center justify-between text-left text-xs sm:text-sm font-medium text-[#2F3E46] min-h-[36px] cursor-pointer"
                  >
                    <span>{t.couldAlsoBeTitle}</span>
                    {openCouldBe ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 text-[#6B6B66]" />}
                  </button>
                  {openCouldBe && (
                    <div className="mt-2 space-y-1.5 rounded-lg bg-[#FAFAF8] p-3 text-xs sm:text-sm border border-[#E6E5E0]">
                      {currentItem.alternatives.map((alt, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-[#1C1C1A]">
                            {t.categories[alt.category]?.label || alt.name}
                          </span>
                          <span className="text-xs text-[#6B6B66]">
                            {Math.round(alt.p * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Accordion: More about this route */}
              <div className="p-3 sm:p-3.5">
                <button
                  type="button"
                  onClick={() => setOpenRoute(!openRoute)}
                  className="flex w-full items-center justify-between text-left text-xs sm:text-sm font-medium text-[#2F3E46] min-h-[36px] cursor-pointer"
                >
                  <span>{t.moreAboutRoute}</span>
                  {openRoute ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 text-[#6B6B66]" />}
                </button>
                {openRoute && (
                  <div className="mt-2 rounded-lg bg-[#FAFAF8] p-3 text-xs sm:text-sm text-[#1C1C1A] leading-relaxed border border-[#E6E5E0]">
                    <p>{categoryMeta.routeHint}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
