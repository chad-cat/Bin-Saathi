import React, { useState } from 'react';
import {
  X,
  Navigation,
  Check,
  AlertTriangle,
  MapPin,
  Clock,
  Phone,
  Crosshair,
  ExternalLink,
} from 'lucide-react';
import { CATEGORY_COLORS } from '../config';
import { Language, i18n } from '../i18n';
import { calculateWalkingMinutes } from '../lib/georef';
import { Category, Site } from '../types';

interface SiteDetailSheetProps {
  site: Site | null;
  onClose: () => void;
  onConfirm: (siteId: string) => void;
  onReport: (siteId: string) => void;
  onPinExactLocation: (siteId: string) => void;
  onUpdateSiteField: (siteId: string, field: 'phone' | 'hours' | 'address', value: string) => void;
  userDistance?: number | null;
  language: Language;
}

export const SiteDetailSheet: React.FC<SiteDetailSheetProps> = ({
  site,
  onClose,
  onConfirm,
  onReport,
  onPinExactLocation,
  onUpdateSiteField,
  userDistance,
  language,
}) => {
  const [editingField, setEditingField] = useState<'phone' | 'hours' | null>(null);
  const [fieldValue, setFieldValue] = useState('');
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [isPinning, setIsPinning] = useState(false);

  if (!site) return null;

  const t = i18n[language];
  const isApproximate = site.latlngSource === 'georef';

  const walkingMins = userDistance ? calculateWalkingMinutes(userDistance) : null;

  // Google Maps walking directions URL
  const googleMapsUrl = site.latlng
    ? `https://www.google.com/maps/dir/?api=1&destination=${site.latlng[0]},${site.latlng[1]}&travelmode=walking`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        site.name + ' IIT Roorkee'
      )}`;

  const handleSaveField = () => {
    if (editingField && fieldValue.trim()) {
      onUpdateSiteField(site.id, editingField, fieldValue.trim());
      setEditingField(null);
      setFieldValue('');
    }
  };

  const handlePin = async () => {
    setIsPinning(true);
    try {
      await onPinExactLocation(site.id);
    } finally {
      setIsPinning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg md:max-w-xl flex-col rounded-t-2xl sm:rounded-2xl border border-[#E6E5E0] bg-[#FAFAF8] p-4 sm:p-6 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#E6E5E0]">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-semibold text-[#1C1C1A]">{site.name}</h2>
              {site.addedBy === 'seed' ? (
                <span className="rounded bg-neutral-200/70 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-[#6B6B66]">
                  {t.sourceSeed}
                </span>
              ) : (site.confirmations || 0) >= 3 ? (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-semibold text-emerald-800">
                  <Check className="h-3.5 w-3.5" />
                  <span>{t.siteVerifiedBadge} ({site.confirmations})</span>
                </span>
              ) : (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-amber-800">
                  {t.siteAddedByUserBadge} ({site.confirmations || 1}/3)
                </span>
              )}
            </div>
            {site.area && <p className="mt-0.5 text-xs sm:text-sm text-[#6B6B66]">{site.area}</p>}
          </div>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl p-2 text-[#6B6B66] hover:bg-neutral-200/50 cursor-pointer min-h-[44px] min-w-[44px]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Hidden site warning banner if 3+ reports */}
        {(site.reports || 0) >= 3 && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-700" />
            <span>{t.siteHiddenNotice}</span>
          </div>
        )}

        {/* Accepted Waste Categories */}
        <div className="mt-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B66]">
            {t.acceptedCategoriesLabel}
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {site.accepts.map((cat) => {
              const catMeta = t.categories[cat] || t.categories.unknown;
              const catColor = CATEGORY_COLORS[cat] || '#7A7A75';
              return (
                <div
                  key={cat}
                  className="flex items-center gap-1.5 rounded-full border border-[#E6E5E0] bg-white px-2.5 py-1 text-xs font-medium text-[#1C1C1A]"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: catColor }}
                  />
                  <span>{catMeta.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distance & Walking Time if location available */}
        {userDistance != null && (
          <div className="mt-3.5 flex items-center justify-between rounded-xl border border-[#E6E5E0] bg-white p-3 text-xs">
            <div className="flex items-center gap-2 text-[#1C1C1A]">
              <MapPin className="h-4 w-4 text-[#2F3E46]" />
              <span className="font-medium">
                {t.distanceApprox(userDistance)}
                {isApproximate && ` (${t.approximateLabel})`}
              </span>
            </div>
            {walkingMins != null && (
              <span className="text-[#6B6B66]">{t.walkingTime(walkingMins)}</span>
            )}
          </div>
        )}

        {/* Details & Contacts: Address, Phone, Hours */}
        <div className="mt-3.5 space-y-2.5 text-xs text-[#1C1C1A]">
          {/* Address */}
          {site.address && (
            <div className="flex items-start gap-2 text-[#6B6B66]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#2F3E46] mt-0.5" />
              <span>{site.address}</span>
            </div>
          )}

          {/* Phone */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-[#2F3E46]" />
              {site.phone ? (
                <a
                  href={`tel:${site.phone}`}
                  className="font-medium text-[#2F3E46] underline hover:opacity-80"
                >
                  {site.phone}
                </a>
              ) : (
                <span className="text-[#6B6B66] italic">No phone listed</span>
              )}
            </div>
            {!site.phone && editingField !== 'phone' && (
              <button
                type="button"
                onClick={() => {
                  setEditingField('phone');
                  setFieldValue('');
                }}
                className="text-[11px] font-medium text-[#2F3E46] underline hover:opacity-80"
              >
                + {t.addNumber}
              </button>
            )}
          </div>

          {editingField === 'phone' && (
            <div className="flex gap-2 pt-1">
              <input
                type="tel"
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                placeholder="e.g. 01332-285000"
                className="flex-1 rounded-lg border border-[#E6E5E0] bg-white px-2.5 py-1 text-xs outline-none focus:border-[#2F3E46]"
              />
              <button
                type="button"
                onClick={handleSaveField}
                className="rounded-lg bg-[#2F3E46] px-3 py-1 text-xs text-white"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingField(null)}
                className="rounded-lg border px-2 text-xs"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Operating Hours */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-[#2F3E46]" />
              {site.hours ? (
                <span>{site.hours}</span>
              ) : (
                <span className="text-[#6B6B66] italic">Hours not specified</span>
              )}
            </div>
            {!site.hours && editingField !== 'hours' && (
              <button
                type="button"
                onClick={() => {
                  setEditingField('hours');
                  setFieldValue('');
                }}
                className="text-[11px] font-medium text-[#2F3E46] underline hover:opacity-80"
              >
                + Add hours
              </button>
            )}
          </div>

          {editingField === 'hours' && (
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                placeholder="e.g. 8:00 AM - 6:00 PM"
                className="flex-1 rounded-lg border border-[#E6E5E0] bg-white px-2.5 py-1 text-xs outline-none focus:border-[#2F3E46]"
              />
              <button
                type="button"
                onClick={handleSaveField}
                className="rounded-lg bg-[#2F3E46] px-3 py-1 text-xs text-white"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingField(null)}
                className="rounded-lg border px-2 text-xs"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Notes */}
          {site.notes && (
            <div className="rounded-lg bg-neutral-100/70 p-2 text-[11px] text-[#6B6B66]">
              {site.notes}
            </div>
          )}
        </div>

        {/* Action: Directions Button */}
        <div className="mt-5">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2F3E46] py-3.5 px-4 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-[#253238] active:scale-[0.98] min-h-[44px]"
          >
            <Navigation className="h-4 w-4" />
            <span>
              {t.directions}
              {isApproximate && ` (${t.approximateLabel})`}
            </span>
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>
        </div>

        {/* GPS Pinning & Confirmation Footer */}
        <div className="mt-4 divide-y divide-[#E6E5E0]/60 border-t border-[#E6E5E0] pt-2 text-xs sm:text-sm">
          {/* I'm standing here button */}
          <div className="py-2.5 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePin}
              disabled={isPinning}
              className="flex items-center gap-1.5 font-medium text-[#2F3E46] hover:underline min-h-[44px] cursor-pointer"
            >
              <Crosshair className={`h-4 w-4 ${isPinning ? 'animate-spin' : ''}`} />
              <span>
                {site.latlngSource === 'gps_pinned'
                  ? t.pinnedSuccess
                  : t.imStandingHere}
              </span>
            </button>
            {site.latlngSource === 'gps_pinned' && (
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                GPS Verified
              </span>
            )}
          </div>

          {/* Confirmation & Report buttons (one vote per device) */}
          <div className="py-2.5 flex items-center justify-between gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                if (!hasConfirmed) {
                  onConfirm(site.id);
                  setHasConfirmed(true);
                }
              }}
              disabled={hasConfirmed}
              className={`flex items-center gap-1.5 text-xs sm:text-sm font-medium min-h-[44px] cursor-pointer ${
                hasConfirmed
                  ? 'text-emerald-800'
                  : 'text-[#6B6B66] hover:text-[#1C1C1A]'
              }`}
            >
              <Check className="h-4 w-4" />
              <span>
                {hasConfirmed
                  ? 'Confirmed'
                  : t.confirmCorrect}
              </span>
              <span className="text-xs text-[#6B6B66]">
                ({site.confirmations || 1})
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!hasReported) {
                  onReport(site.id);
                  setHasReported(true);
                }
              }}
              disabled={hasReported}
              className={`flex items-center gap-1.5 text-xs sm:text-sm min-h-[44px] cursor-pointer ${
                hasReported ? 'text-amber-800' : 'text-[#6B6B66] hover:text-red-700'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{hasReported ? 'Reported' : t.reportProblem}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
