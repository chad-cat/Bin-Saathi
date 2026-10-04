import { buildSeedSites, pxToLatLng, refitGeoref } from '../lib/georef';
import { AppSettings, ContactEntry, ScanFeedback, ScanRecord, ScanResponse, Site } from '../types';

class SafeStorage {
  private mem = new Map<string, string>();

  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // In-memory fallback
    }
    return this.mem.get(key) || null;
  }

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // In-memory fallback
    }
    this.mem.set(key, value);
  }

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // In-memory fallback
    }
    this.mem.delete(key);
  }

  clear(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch {
      // In-memory fallback
    }
    this.mem.clear();
  }
}

export const safeStore = new SafeStorage();

const KEYS = {
  LANG: 'bs:lang',
  SETTINGS: 'bs:settings',
  RECORDS: 'bs:records',
  SITES: 'bs:sites',
  CONTACTS: 'bs:contacts',
  CACHE: 'bs:cache',
  LEARN_PROGRESS: 'bs:learnProgress',
  COUNTER_PREFIX: 'bs:counter:',
};

// Repository interfaces for future cloud backend interchangeability
export interface FeedbackRepository {
  saveFeedback(recordId: string, feedback: ScanFeedback): Promise<boolean>;
}

export interface SiteRepository {
  getSites(): Promise<Site[]>;
  saveSite(site: Site): Promise<void>;
  updateSite(site: Site): Promise<void>;
  confirmSite(siteId: string): Promise<void>;
  reportSite(siteId: string): Promise<void>;
  pinSite(siteId: string, latlng: [number, number]): Promise<Site[]>;
}

export interface RecordRepository {
  getRecords(): Promise<ScanRecord[]>;
  saveRecord(record: ScanRecord): Promise<void>;
  clearRecords(): Promise<void>;
}

export function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${KEYS.COUNTER_PREFIX}${year}-${month}-${day}`;
}

const DEFAULT_CONTACTS: ContactEntry[] = [
  {
    id: 'campus_estate',
    titleEn: 'Campus Hygiene & Estate Works Office',
    titleHi: 'परिसर स्वच्छता एवं संपदा कार्य कार्यालय',
    subtitleEn: 'IIT Roorkee Estate & Sanitation Department',
    subtitleHi: 'आईआईटी रुड़की संपदा एवं स्वच्छता विभाग',
    phone: '',
    address: 'Estate & Works Building, Near Central Library, IIT Roorkee',
  },
  {
    id: 'roorkee_municipal',
    titleEn: 'Municipal Corporation Roorkee (Nagar Nigam)',
    titleHi: 'नगर निगम रुड़की (ठोस अपशिष्ट शाखा)',
    subtitleEn: 'Local urban authority for Roorkee region',
    subtitleHi: 'रुड़की क्षेत्र का स्थानीय नगर निकाय',
    phone: '',
    address: 'Nagar Nigam Roorkee, Civil Lines, Roorkee, Uttarakhand 247667',
  },
];

export const storageService = {
  // Language
  getLanguage(): 'en' | 'hi' {
    const val = safeStore.getItem(KEYS.LANG);
    if (val === 'en' || val === 'hi') return val;
    // Default to browser language falling back to English
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('hi')) return 'hi';
    }
    return 'en';
  },

  setLanguage(lang: 'en' | 'hi') {
    safeStore.setItem(KEYS.LANG, lang);
  },

  // Settings
  getSettings(): AppSettings {
    const defaults: AppSettings = {
      language: this.getLanguage(),
      modelScan: 'gemini-3.1-flash-lite',
      modelSmart: 'gemini-3.8-flash',
      saveThumbnails: true,
      hasSeenPrivacyNotice: false,
      shareWithCommunity: false,
    };
    const raw = safeStore.getItem(KEYS.SETTINGS);
    if (!raw) return defaults;
    try {
      return { ...defaults, ...JSON.parse(raw) };
    } catch {
      return defaults;
    }
  },

  saveSettings(settings: Partial<AppSettings>) {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    safeStore.setItem(KEYS.SETTINGS, JSON.stringify(updated));
    if (settings.language) {
      safeStore.setItem(KEYS.LANG, settings.language);
    }
    return updated;
  },

  // Daily AI request counter
  getDailyAiCount(): number {
    const key = getTodayKey();
    const raw = safeStore.getItem(key);
    return raw ? parseInt(raw, 10) || 0 : 0;
  },

  incrementDailyAiCount(): number {
    const key = getTodayKey();
    const count = this.getDailyAiCount() + 1;
    safeStore.setItem(key, String(count));
    return count;
  },

  // Cache: Hash -> ScanResponse
  getCachedScan(hash: string): ScanResponse | null {
    try {
      const raw = safeStore.getItem(`${KEYS.CACHE}_${hash}`);
      if (raw) return JSON.parse(raw);
    } catch {
      return null;
    }
    return null;
  },

  setCachedScan(hash: string, response: ScanResponse) {
    try {
      safeStore.setItem(`${KEYS.CACHE}_${hash}`, JSON.stringify(response));
    } catch {
      // Ignore cache storage errors
    }
  },

  // Records (ScanRecord) - latest 200 items, evict oldest first
  getRecords(): ScanRecord[] {
    try {
      const raw = safeStore.getItem(KEYS.RECORDS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  addRecord(record: ScanRecord): void {
    try {
      const list = this.getRecords();
      // Insert newest first
      const updated = [record, ...list.filter((r) => r.id !== record.id)].slice(0, 200);
      safeStore.setItem(KEYS.RECORDS, JSON.stringify(updated));
    } catch {
      // Fail safely
    }
  },

  updateRecordFeedback(recordId: string, feedback: ScanFeedback): boolean {
    try {
      const list = this.getRecords();
      const idx = list.findIndex((r) => r.id === recordId);
      if (idx !== -1) {
        list[idx].feedback = { ...list[idx].feedback, ...feedback, updatedAt: Date.now() };
        safeStore.setItem(KEYS.RECORDS, JSON.stringify(list));
        return true;
      }
    } catch {
      return false;
    }
    return false;
  },

  // Sites (Seed + User-Added)
  getSites(): Site[] {
    try {
      const raw = safeStore.getItem(KEYS.SITES);
      if (!raw) {
        const initial = buildSeedSites();
        safeStore.setItem(KEYS.SITES, JSON.stringify(initial));
        return initial;
      }
      const parsed = JSON.parse(raw) as Site[];
      let hasUpdates = false;
      const verified = parsed.map((s) => {
        if ((!s.latlng || s.latlng.length !== 2) && s.px) {
          s.latlng = pxToLatLng(s.px);
          hasUpdates = true;
        }
        return s;
      });
      if (hasUpdates) {
        safeStore.setItem(KEYS.SITES, JSON.stringify(verified));
      }
      return verified;
    } catch {
      return buildSeedSites();
    }
  },

  saveSite(site: Site): void {
    try {
      const list = this.getSites();
      const updated = [site, ...list.filter((s) => s.id !== site.id)];
      safeStore.setItem(KEYS.SITES, JSON.stringify(updated));
    } catch {
      // Fail safely
    }
  },

  updateSite(updatedSite: Site): void {
    try {
      const list = this.getSites();
      const idx = list.findIndex((s) => s.id === updatedSite.id);
      if (idx !== -1) {
        list[idx] = updatedSite;
        safeStore.setItem(KEYS.SITES, JSON.stringify(list));
      }
    } catch {
      // Fail safely
    }
  },

  confirmSite(siteId: string): void {
    try {
      const list = this.getSites();
      const target = list.find((s) => s.id === siteId);
      if (target) {
        target.confirmations = (target.confirmations || 0) + 1;
        safeStore.setItem(KEYS.SITES, JSON.stringify(list));
      }
    } catch {
      // Fail safely
    }
  },

  reportSite(siteId: string): void {
    try {
      const list = this.getSites();
      const target = list.find((s) => s.id === siteId);
      if (target) {
        target.reports = (target.reports || 0) + 1;
        safeStore.setItem(KEYS.SITES, JSON.stringify(list));
      }
    } catch {
      // Fail safely
    }
  },

  /**
   * Pins a site with exact GPS lat/lng.
   * If 2 or more sites have been GPS-pinned, refits the georeferencing model
   * and shifts all georef-derived positions consistently!
   */
  pinSite(siteId: string, latlng: [number, number]): Site[] {
    const list = this.getSites();
    const target = list.find((s) => s.id === siteId);
    if (!target) return list;

    target.latlng = latlng;
    target.latlngSource = 'gps_pinned';

    // Collect all pinned sites with map pixel coordinates
    const pinned = list.filter(
      (s): s is Site & { px: [number, number]; latlng: [number, number] } =>
        s.latlngSource === 'gps_pinned' && Boolean(s.px) && Boolean(s.latlng)
    );

    if (pinned.length >= 2) {
      // Refit georef transformation
      refitGeoref(pinned.map((s) => ({ px: s.px, latlng: s.latlng })));

      // Shift all georef-derived positions
      for (const site of list) {
        if (site.latlngSource === 'georef' && site.px) {
          site.latlng = pxToLatLng(site.px);
        }
      }
    }

    safeStore.setItem(KEYS.SITES, JSON.stringify(list));
    return list;
  },

  // Contacts
  getContacts(): ContactEntry[] {
    try {
      const raw = safeStore.getItem(KEYS.CONTACTS);
      if (!raw) {
        safeStore.setItem(KEYS.CONTACTS, JSON.stringify(DEFAULT_CONTACTS));
        return DEFAULT_CONTACTS;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_CONTACTS;
    }
  },

  saveContacts(contacts: ContactEntry[]): void {
    try {
      safeStore.setItem(KEYS.CONTACTS, JSON.stringify(contacts));
    } catch {
      // Fail safely
    }
  },

  updateContact(id: string, partial: Partial<ContactEntry>): void {
    const list = this.getContacts();
    const idx = list.findIndex((c) => c.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...partial };
      this.saveContacts(list);
    }
  },

  // Data management
  exportAllData(): string {
    const payload = {
      lang: safeStore.getItem(KEYS.LANG),
      settings: safeStore.getItem(KEYS.SETTINGS),
      records: safeStore.getItem(KEYS.RECORDS),
      sites: safeStore.getItem(KEYS.SITES),
      contacts: safeStore.getItem(KEYS.CONTACTS),
      dailyCount: this.getDailyAiCount(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(payload, null, 2);
  },

  importAllData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.lang) safeStore.setItem(KEYS.LANG, data.lang);
      if (data.settings) safeStore.setItem(KEYS.SETTINGS, data.settings);
      if (data.records) safeStore.setItem(KEYS.RECORDS, data.records);
      if (data.sites) safeStore.setItem(KEYS.SITES, data.sites);
      if (data.contacts) safeStore.setItem(KEYS.CONTACTS, data.contacts);
      return true;
    } catch {
      return false;
    }
  },

  clearAllData(): void {
    safeStore.clear();
  },
};

