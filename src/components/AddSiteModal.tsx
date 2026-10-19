import React, { useState } from 'react';
import { X, MapPin, Crosshair, AlertCircle } from 'lucide-react';
import { CATEGORY_COLORS } from '../config';
import { Language, i18n } from '../i18n';
import { latLngToPx, pxToLatLng } from '../lib/georef';
import { Category, Site } from '../types';

interface AddSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSite: (site: Site) => void;
  userCoords?: [number, number] | null;
  mapTapCoords?: [number, number] | null;
  onRequestMapTap: () => void;
  language: Language;
}

const ALL_SELECTABLE_CATEGORIES: Category[] = [
  'wet',
  'dry',
  'e_waste',
  'battery',
  'special_care',
  'sanitary',
  'horticulture',
  'c_and_d',
  'reuse_donate',
];

export const AddSiteModal: React.FC<AddSiteModalProps> = ({
  isOpen,
  onClose,
  onSaveSite,
  userCoords,
  mapTapCoords,
  onRequestMapTap,
  language,
}) => {
  const [name, setName] = useState('');
  const [siteType, setSiteType] = useState('e_waste');
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(['e_waste']);
  const [locationMode, setLocationMode] = useState<'gps' | 'map_tap' | 'manual'>('gps');
  const [manualLat, setManualLat] = useState('29.865');
  const [manualLng, setManualLng] = useState('77.897');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const t = i18n[language];

  const handleToggleCategory = (cat: Category) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Site name is required.');
      return;
    }

    if (selectedCategories.length === 0) {
      setError('Select at least one accepted waste category.');
      return;
    }

    let finalLatLng: [number, number] | undefined;
    let finalPx: [number, number] | undefined;
    let latlngSource: 'georef' | 'gps_pinned' | 'user_entered' = 'user_entered';

    if (locationMode === 'gps' && userCoords) {
      finalLatLng = userCoords;
      finalPx = latLngToPx(userCoords);
      latlngSource = 'gps_pinned';
    } else if (locationMode === 'map_tap' && mapTapCoords) {
      if (mapTapCoords[0] > 20 && mapTapCoords[0] < 40) {
        // Real geographic lat/lng from interactive map
        finalLatLng = [Number(mapTapCoords[0].toFixed(6)), Number(mapTapCoords[1].toFixed(6))];
        finalPx = latLngToPx(finalLatLng);
      } else {
        finalPx = mapTapCoords;
        finalLatLng = pxToLatLng(mapTapCoords);
      }
      latlngSource = 'georef';
    } else if (locationMode === 'manual') {
      const lat = parseFloat(manualLat);
      const lng = parseFloat(manualLng);
      if (!isNaN(lat) && !isNaN(lng)) {
        finalLatLng = [lat, lng];
        finalPx = latLngToPx([lat, lng]);
        latlngSource = 'user_entered';
      }
    }

    if (!finalLatLng || !finalPx) {
      setError('Please provide a valid location (GPS, map tap, or coordinates).');
      return;
    }

    const newSite: Site = {
      id: `user_site_${Date.now()}`,
      kind: 'community',
      name: name.trim(),
      area: address.trim() || 'IIT Roorkee Campus',
      px: finalPx,
      latlng: finalLatLng,
      latlngSource,
      accepts: selectedCategories,
      acceptsVerified: false,
      address: address.trim() || undefined,
      phone: phone.trim() || null,
      hours: hours.trim() || null,
      notes: notes.trim() || undefined,
      addedBy: 'user',
      confirmations: 1,
      reports: 0,
      createdAt: Date.now(),
    };

    onSaveSite(newSite);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-md sm:max-w-lg md:max-w-xl flex-col rounded-t-2xl sm:rounded-2xl border border-[#E6E5E0] bg-[#FAFAF8] p-4 sm:p-6 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E6E5E0]">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-[#1C1C1A]">{t.addSiteTitle}</h2>
            <p className="text-xs text-[#6B6B66]">{t.localDeviceOnlyNotice}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl p-2 text-[#6B6B66] hover:bg-neutral-200/50 min-h-[44px] min-w-[44px] cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs sm:text-sm text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs sm:text-sm">
          {/* Site Name */}
          <div>
            <label className="font-semibold text-[#1C1C1A]">{t.siteNameLabel}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Electrical Dept E-Waste Bin, Ganga Bhawan Depot"
              className="mt-1 w-full rounded-xl border border-[#E6E5E0] bg-white px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-[#1C1C1A] outline-none focus:border-[#2F3E46] min-h-[44px]"
            />
          </div>

          {/* Site Type */}
          <div>
            <label className="font-semibold text-[#1C1C1A]">{t.siteTypeLabel}</label>
            <select
              value={siteType}
              onChange={(e) => setSiteType(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E6E5E0] bg-white px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-[#1C1C1A] outline-none focus:border-[#2F3E46] min-h-[44px] cursor-pointer"
            >
              {Object.entries(t.siteTypeOptions).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Accepted Categories (Multi-select) */}
          <div>
            <label className="font-semibold text-[#1C1C1A]">
              {t.acceptedCategoriesLabel}
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {ALL_SELECTABLE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                const color = CATEGORY_COLORS[cat];
                const catMeta = t.categories[cat] || t.categories.unknown;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleToggleCategory(cat)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs sm:text-sm transition min-h-[38px] cursor-pointer ${
                      isSelected
                        ? 'border-[#2F3E46] bg-white font-medium text-[#1C1C1A] shadow-xs ring-1 ring-[#2F3E46]'
                        : 'border-[#E6E5E0] bg-white/70 text-[#6B6B66] hover:bg-white'
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span>{catMeta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location Mode */}
          <div>
            <label className="font-semibold text-[#1C1C1A]">{t.locationLabel}</label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLocationMode('gps')}
                className={`rounded-xl border py-2.5 px-2 text-center text-xs sm:text-sm transition min-h-[44px] cursor-pointer ${
                  locationMode === 'gps'
                    ? 'border-[#2F3E46] bg-[#2F3E46] text-white font-medium'
                    : 'border-[#E6E5E0] bg-white text-[#1C1C1A] hover:bg-neutral-50'
                }`}
              >
                Current GPS
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocationMode('map_tap');
                  onRequestMapTap();
                }}
                className={`rounded-xl border py-2.5 px-2 text-center text-xs sm:text-sm transition min-h-[44px] cursor-pointer ${
                  locationMode === 'map_tap'
                    ? 'border-[#2F3E46] bg-[#2F3E46] text-white font-medium'
                    : 'border-[#E6E5E0] bg-white text-[#1C1C1A] hover:bg-neutral-50'
                }`}
              >
                Tap on Map
              </button>
              <button
                type="button"
                onClick={() => setLocationMode('manual')}
                className={`rounded-xl border py-2.5 px-2 text-center text-xs sm:text-sm transition min-h-[44px] cursor-pointer ${
                  locationMode === 'manual'
                    ? 'border-[#2F3E46] bg-[#2F3E46] text-white font-medium'
                    : 'border-[#E6E5E0] bg-white text-[#1C1C1A] hover:bg-neutral-50'
                }`}
              >
                Coordinates
              </button>
            </div>

            <div className="mt-2 rounded-xl bg-neutral-100/70 p-3 text-xs text-[#6B6B66]">
              {locationMode === 'gps' &&
                (userCoords
                  ? `GPS fixed: ${userCoords[0].toFixed(5)}, ${userCoords[1].toFixed(5)}`
                  : 'GPS will be read upon submission')}
              {locationMode === 'map_tap' &&
                (mapTapCoords
                  ? mapTapCoords[0] > 20
                    ? `Position set: ${mapTapCoords[0].toFixed(5)}°N, ${mapTapCoords[1].toFixed(5)}°E`
                    : `Position set: pixel (${mapTapCoords[0]}, ${mapTapCoords[1]})`
                  : t.tapMapInstruction)}
              {locationMode === 'manual' && (
                <div className="flex gap-2 pt-1.5">
                  <input
                    type="text"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    placeholder="Latitude"
                    className="w-1/2 rounded-xl border border-[#E6E5E0] bg-white px-3 py-2 text-xs min-h-[40px]"
                  />
                  <input
                    type="text"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    placeholder="Longitude"
                    className="w-1/2 rounded-xl border border-[#E6E5E0] bg-white px-3 py-2 text-xs min-h-[40px]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="font-semibold text-[#1C1C1A]">{t.addressLabel}</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Near Cautley Bhawan Mess Gate"
              className="mt-1 w-full rounded-xl border border-[#E6E5E0] bg-white px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-[#1C1C1A] outline-none focus:border-[#2F3E46] min-h-[44px]"
            />
          </div>

          {/* Phone (Optional) */}
          <div>
            <label className="font-semibold text-[#1C1C1A]">{t.phoneLabel}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 01332-285000 or 9876543210"
              className="mt-1 w-full rounded-xl border border-[#E6E5E0] bg-white px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-[#1C1C1A] outline-none focus:border-[#2F3E46] min-h-[44px]"
            />
          </div>

          {/* Hours & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#1C1C1A]">{t.hoursLabel}</label>
              <input
                type="text"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g. 9 AM - 5 PM"
                className="mt-1 w-full rounded-xl border border-[#E6E5E0] bg-white px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-[#1C1C1A] outline-none focus:border-[#2F3E46] min-h-[44px]"
              />
            </div>
            <div>
              <label className="font-semibold text-[#1C1C1A]">{t.notesLabel}</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Dedicated e-waste receptacle"
                className="mt-1 w-full rounded-xl border border-[#E6E5E0] bg-white px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-[#1C1C1A] outline-none focus:border-[#2F3E46] min-h-[44px]"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full rounded-xl bg-[#2F3E46] py-3.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-[#253238] active:scale-[0.98] min-h-[48px] cursor-pointer"
            >
              {t.submitSiteBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
