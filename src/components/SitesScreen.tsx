import React, { useState, useEffect } from 'react';
import {
  Search,
  List,
  Map as MapIcon,
  Plus,
  Phone,
  ChevronDown,
  ChevronUp,
  MapPin,
  ChevronRight,
  Navigation,
  Info,
  ExternalLink,
  Check,
  Cloud,
} from 'lucide-react';
import { CATEGORY_COLORS } from '../config';
import { Language, i18n } from '../i18n';
import { calculateDistanceMeters } from '../lib/georef';
import { getSiteRepository } from '../services/repositories';
import { storageService } from '../services/storage';
import { Category, ContactEntry, Site } from '../types';
import { AddSiteModal } from './AddSiteModal';
import { CampusMap } from './CampusMap';
import { SiteDetailSheet } from './SiteDetailSheet';

interface SitesScreenProps {
  initialFilter?: Category | 'all';
  onAddSiteRequested?: () => void;
  language: Language;
  shareWithCommunity?: boolean;
}

const FILTER_CATEGORIES: (Category | 'all')[] = [
  'all',
  'wet',
  'dry',
  'e_waste',
  'battery',
  'special_care',
  'sanitary',
];

export const SitesScreen: React.FC<SitesScreenProps> = ({
  initialFilter = 'all',
  language,
  shareWithCommunity = false,
}) => {
  const t = i18n[language];

  const [sites, setSites] = useState<Site[]>(() => storageService.getSites());
  const [contacts, setContacts] = useState<ContactEntry[]>(() => storageService.getContacts());
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');

  // User geolocation state
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [hasRequestedLocation, setHasRequestedLocation] = useState<boolean>(false);

  // Modals & Sheets
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactPhoneInput, setContactPhoneInput] = useState('');

  // Map tap picking state for adding site
  const [isPickingMapLocation, setIsPickingMapLocation] = useState(false);
  const [pickedMapPx, setPickedMapPx] = useState<[number, number] | null>(null);

  // Load sites from repository (Local or Firebase according to settings)
  useEffect(() => {
    let isMounted = true;
    const repo = getSiteRepository(shareWithCommunity);
    repo.getSites().then((loadedSites) => {
      if (isMounted) {
        setSites(loadedSites);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [shareWithCommunity]);

  // Sync initialFilter prop if changed externally (e.g. from ResultView nearest drop-off click)
  useEffect(() => {
    if (initialFilter) {
      setSelectedCategory(initialFilter);
    }
  }, [initialFilter]);

  // Request user GPS location
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      return;
    }
    setIsLocating(true);
    setHasRequestedLocation(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords([pos.coords.latitude, pos.coords.longitude]);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Calculate distance for each site from user location
  const getSiteDistance = (site: Site): number | null => {
    if (!userCoords || !site.latlng) return null;
    return calculateDistanceMeters(
      userCoords[0],
      userCoords[1],
      site.latlng[0],
      site.latlng[1]
    );
  };

  // Filtered & sorted sites
  const displayedSites = sites
    .filter((site) => {
      // 1. Category filter
      if (selectedCategory !== 'all' && !site.accepts.includes(selectedCategory)) {
        return false;
      }
      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = site.name.toLowerCase().includes(q);
        const matchArea = site.area?.toLowerCase().includes(q);
        const matchAddr = site.address?.toLowerCase().includes(q);
        if (!matchName && !matchArea && !matchAddr) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (userCoords) {
        const distA = getSiteDistance(a) ?? Infinity;
        const distB = getSiteDistance(b) ?? Infinity;
        return distA - distB;
      }
      return a.name.localeCompare(b.name);
    });

  // Check if current category has zero known sites
  const hasZeroSitesForCategory =
    selectedCategory !== 'all' &&
    sites.filter((s) => s.accepts.includes(selectedCategory)).length === 0;

  // Handlers for site actions using repository (Local or Firebase)
  const handleConfirmSite = async (siteId: string) => {
    const repo = getSiteRepository(shareWithCommunity);
    const res = await repo.confirmSite(siteId);
    if (res.success) {
      const updated = await repo.getSites();
      setSites(updated);
      if (selectedSite && selectedSite.id === siteId) {
        setSelectedSite({
          ...selectedSite,
          confirmations: res.newCount,
          acceptsVerified: res.newCount >= 3,
        });
      }
    }
  };

  const handleReportSite = async (siteId: string) => {
    const repo = getSiteRepository(shareWithCommunity);
    const res = await repo.reportSite(siteId);
    const updated = await repo.getSites();
    setSites(updated);
    if (selectedSite && selectedSite.id === siteId) {
      if (res.hidden) {
        setSelectedSite(null);
      } else {
        setSelectedSite({
          ...selectedSite,
          reports: res.newCount,
        });
      }
    }
  };

  const handlePinLocation = (siteId: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!navigator.geolocation) {
        alert('Geolocation not supported on this browser.');
        return reject();
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          const updatedList = storageService.pinSite(siteId, coords);
          setSites(updatedList);
          const updatedSite = updatedList.find((s) => s.id === siteId);
          if (updatedSite) setSelectedSite(updatedSite);
          resolve();
        },
        (err) => {
          alert('Could not get GPS fix. Please ensure location is enabled.');
          reject(err);
        },
        { enableHighAccuracy: true }
      );
    });
  };

  const handleSaveContactPhone = (contactId: string) => {
    if (contactPhoneInput.trim()) {
      storageService.updateContact(contactId, { phone: contactPhoneInput.trim() });
      setContacts(storageService.getContacts());
      setEditingContactId(null);
      setContactPhoneInput('');
    }
  };

  const handleSaveNewSite = async (newSite: Site) => {
    const repo = getSiteRepository(shareWithCommunity);
    const created = await repo.addSite(newSite);
    const updated = await repo.getSites();
    setSites(updated);
    setSelectedSite(created);
    setPickedMapPx(null);
    setIsPickingMapLocation(false);
  };

  return (
    <div className="w-full max-w-4xl lg:max-w-5xl mx-auto flex flex-col space-y-4 pb-24 sm:pb-28 pt-1">
      {/* Community Sync Status Banner */}
      {shareWithCommunity && (
        <div className="flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50/70 px-3.5 py-2.5 text-xs sm:text-sm text-purple-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 sm:h-5 sm:w-5 text-purple-700 shrink-0" />
            <span className="font-medium">
              {language === 'hi'
                ? 'सामुदायिक सिंक सक्रिय: ड्रॉप-ऑफ स्थान फायरस्टोर पर साझा हैं'
                : 'Community Sync Active: Drop-off sites synced with Firestore'}
            </span>
          </div>
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      )}

      {/* 1. Collapsed card: Campus and municipal contacts (Section 8.3) */}
      <div className="rounded-xl border border-[#E6E5E0] bg-white p-3.5 sm:p-4 shadow-2xs">
        <button
          type="button"
          onClick={() => setIsContactsOpen(!isContactsOpen)}
          className="flex w-full items-center justify-between text-left min-h-[40px] cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-[#2F3E46]" />
            <span className="text-xs sm:text-sm font-semibold text-[#1C1C1A]">
              {t.campusContactsTitle}
            </span>
          </div>
          {isContactsOpen ? (
            <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-[#6B6B66]" />
          ) : (
            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-[#6B6B66]" />
          )}
        </button>

        {isContactsOpen && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-[#E6E5E0] text-xs sm:text-sm">
            {contacts.map((contact) => (
              <div key={contact.id} className="rounded-lg border border-[#E6E5E0]/70 bg-[#FAFAF8] p-3 space-y-1.5">
                <div>
                  <h4 className="font-semibold text-[#1C1C1A]">
                    {language === 'hi' ? contact.titleHi : contact.titleEn}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-[#6B6B66]">
                    {language === 'hi' ? contact.subtitleHi : contact.subtitleEn}
                  </p>
                  {contact.address && (
                    <p className="mt-0.5 text-[10px] sm:text-[11px] text-[#6B6B66]">{contact.address}</p>
                  )}
                </div>

                {/* Phone number & edit link */}
                <div className="mt-2 flex items-center justify-between pt-1 border-t border-[#E6E5E0]/50">
                  {contact.phone ? (
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-1.5 font-medium text-[#2F3E46] underline min-h-[40px]"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>{contact.phone}</span>
                    </a>
                  ) : (
                    <span className="text-xs text-[#6B6B66] italic">No phone on record</span>
                  )}

                  {editingContactId !== contact.id && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingContactId(contact.id);
                        setContactPhoneInput(contact.phone || '');
                      }}
                      className="min-h-[40px] px-2 text-xs font-medium text-[#2F3E46] underline hover:opacity-80 cursor-pointer"
                    >
                      {contact.phone ? 'Edit' : `+ ${t.addNumber}`}
                    </button>
                  )}
                </div>

                {editingContactId === contact.id && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="tel"
                      value={contactPhoneInput}
                      onChange={(e) => setContactPhoneInput(e.target.value)}
                      placeholder={t.enterPhone}
                      className="flex-1 rounded-lg border border-[#E6E5E0] bg-white px-2.5 py-1.5 text-xs sm:text-sm outline-none focus:border-[#2F3E46] min-h-[40px]"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveContactPhone(contact.id)}
                      className="rounded-lg bg-[#2F3E46] px-3 py-1.5 text-xs sm:text-sm text-white min-h-[40px] cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingContactId(null)}
                      className="rounded-lg border px-2.5 text-xs sm:text-sm min-h-[40px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Top search field */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 sm:left-4 h-4 w-4 sm:h-4.5 sm:w-4.5 text-[#6B6B66]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchSitesPlaceholder}
          className="w-full rounded-xl border border-[#E6E5E0] bg-white py-2.5 sm:py-3 pl-10 sm:pl-11 pr-11 text-xs sm:text-sm text-[#1C1C1A] placeholder-[#6B6B66] shadow-2xs outline-none focus:border-[#2F3E46] min-h-[44px]"
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

      {/* 3. Horizontal scrolling / wrapping category filter chips */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto md:flex-wrap pb-1 scrollbar-none">
        {FILTER_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          const label =
            cat === 'all'
              ? t.filterAll
              : t.categories[cat]?.label || cat;
          const color = cat !== 'all' ? CATEGORY_COLORS[cat] : undefined;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 sm:px-3.5 py-2 text-xs sm:text-sm transition min-h-[40px] cursor-pointer ${
                isSelected
                  ? 'border-[#2F3E46] bg-[#2F3E46] text-white font-medium shadow-xs'
                  : 'border-[#E6E5E0] bg-white text-[#1C1C1A] hover:bg-neutral-50'
              }`}
            >
              {color && (
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
              )}
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Controls Row: List | Map segmented control + Add a site button */}
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <div className="flex rounded-xl border border-[#E6E5E0] bg-white p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium transition min-h-[40px] cursor-pointer ${
              viewMode === 'list'
                ? 'bg-[#2F3E46] text-white shadow-xs'
                : 'text-[#6B6B66] hover:text-[#1C1C1A]'
            }`}
          >
            <List className="h-4 w-4" />
            <span>{t.viewList}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium transition min-h-[40px] cursor-pointer ${
              viewMode === 'map'
                ? 'bg-[#2F3E46] text-white shadow-xs'
                : 'text-[#6B6B66] hover:text-[#1C1C1A]'
            }`}
          >
            <MapIcon className="h-4 w-4" />
            <span>{t.viewMap}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl border border-[#E6E5E0] bg-white px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-[#2F3E46] shadow-2xs hover:bg-neutral-50 active:scale-95 min-h-[44px] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>{t.addSite}</span>
        </button>
      </div>

      {/* Geolocation status / prompt if not granted */}
      {!userCoords && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-[#E6E5E0] bg-white p-3 text-xs sm:text-sm flex-wrap sm:flex-nowrap">
          <span className="text-[#6B6B66]">Sort by nearest location:</span>
          <button
            type="button"
            onClick={handleRequestLocation}
            disabled={isLocating}
            className="flex items-center gap-1.5 rounded-xl bg-[#2F3E46] px-3.5 py-2 text-xs sm:text-sm font-medium text-white hover:bg-[#253238] min-h-[44px] cursor-pointer shrink-0"
          >
            <Navigation className="h-3.5 w-3.5" />
            <span>{isLocating ? 'Locating...' : t.useMyLocation}</span>
          </button>
        </div>
      )}

      {/* 5. View Content: Map View or List View */}
      {viewMode === 'map' ? (
        <CampusMap
          sites={sites}
          selectedCategory={selectedCategory}
          onSelectSite={(site) => setSelectedSite(site)}
          userCoords={userCoords}
          onUserLocationUpdate={(coords) => setUserCoords(coords)}
          isPickingLocation={isPickingMapLocation}
          onMapClick={(coords) => {
            setPickedMapPx(coords);
            setIsPickingMapLocation(false);
            setIsAddModalOpen(true);
          }}
          pickedPx={pickedMapPx}
          language={language}
        />
      ) : (
        /* List View */
        <div>
          {hasZeroSitesForCategory ? (
            /* Empty state for categories with no known site (Section 8.3) */
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 text-center shadow-xs">
              <Info className="mx-auto h-8 w-8 text-[#6B6B66]" />
              <h3 className="mt-2 text-sm sm:text-base font-semibold text-[#1C1C1A]">
                {t.emptyCategoryHeading(
                  t.categories[selectedCategory as Category]?.label || String(selectedCategory)
                )}
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-[#6B6B66] leading-relaxed max-w-md mx-auto">
                {t.emptyCategoryExplanation}
              </p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#2F3E46] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-[#253238] active:scale-95 min-h-[44px] cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>{t.addSite}</span>
              </button>
            </div>
          ) : displayedSites.length === 0 ? (
            <div className="rounded-xl border border-[#E6E5E0] bg-white p-8 text-center text-xs sm:text-sm text-[#6B6B66]">
              {t.noSitesMatchFilter}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {displayedSites.map((site) => {
                const distance = getSiteDistance(site);
                const isLarge = site.kind === 'large_site';
                const isCommunity = site.kind === 'community';

                return (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => setSelectedSite(site)}
                    className="flex w-full items-center justify-between p-3.5 sm:p-4 text-left transition hover:bg-[#FAFAF8] group rounded-xl border border-[#E6E5E0] bg-white shadow-2xs min-h-[68px] cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {isLarge ? (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white font-bold text-xs shadow-xs">
                          {site.id}
                        </div>
                      ) : isCommunity ? (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white font-bold text-xs shadow-xs">
                          ★
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 border border-[#E6E5E0]">
                          <div className="flex -space-x-1">
                            <span className="h-3 w-3 rounded-full bg-orange-500" />
                            <span className="h-3 w-3 rounded-full bg-purple-600" />
                          </div>
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-semibold text-[#1C1C1A] truncate max-w-[200px] sm:max-w-none">
                            {site.name}
                          </span>
                          {site.addedBy === 'seed' ? (
                            <span className="text-[10px] text-[#6B6B66]">
                              ({t.sourceSeed})
                            </span>
                          ) : (site.confirmations || 0) >= 3 ? (
                            <span className="inline-flex items-center gap-0.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-800">
                              <Check className="h-2.5 w-2.5" />
                              <span>{t.siteVerifiedBadge}</span>
                            </span>
                          ) : (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-800">
                              {t.siteAddedByUserBadge}
                            </span>
                          )}
                        </div>

                        {site.area && (
                          <p className="text-[11px] sm:text-xs text-[#6B6B66] truncate">{site.area}</p>
                        )}

                        {/* Category Dots */}
                        <div className="mt-1 flex items-center gap-1">
                          {site.accepts.map((cat) => (
                            <span
                              key={cat}
                              className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full"
                              style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                              title={t.categories[cat]?.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {distance != null && (
                        <span className="text-[11px] sm:text-xs font-medium text-[#2F3E46]">
                          {t.distanceApprox(distance)}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-[#6B6B66] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Site Detail Bottom Sheet */}
      {selectedSite && (
        <SiteDetailSheet
          site={selectedSite}
          onClose={() => setSelectedSite(null)}
          onConfirm={handleConfirmSite}
          onReport={handleReportSite}
          onPinExactLocation={handlePinLocation}
          onUpdateSiteField={(id, field, val) => {
            storageService.updateSite({ ...selectedSite, [field]: val });
            setSites(storageService.getSites());
            setSelectedSite((prev) => (prev ? { ...prev, [field]: val } : null));
          }}
          userDistance={getSiteDistance(selectedSite)}
          language={language}
        />
      )}

      {/* Add Site Modal */}
      {isAddModalOpen && (
        <AddSiteModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSaveSite={handleSaveNewSite}
          userCoords={userCoords}
          mapTapCoords={pickedMapPx}
          onRequestMapTap={() => {
            setIsAddModalOpen(false);
            setViewMode('map');
            setIsPickingMapLocation(true);
          }}
          language={language}
        />
      )}
    </div>
  );
};
