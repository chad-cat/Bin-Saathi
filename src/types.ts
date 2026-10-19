export type Category =
  | 'wet'
  | 'dry'
  | 'sanitary'
  | 'special_care'
  | 'e_waste'
  | 'battery'
  | 'horticulture'
  | 'c_and_d'
  | 'biomedical'
  | 'hazardous'
  | 'reuse_donate'
  | 'unknown';

export type DrySubtype = 'recyclable' | 'non_recyclable' | 'inert';
export type HazardLevel = 'none' | 'low' | 'high';
export type SceneType = 'items' | 'not_waste' | 'unclear';

export interface ScannedItem {
  itemKey: string;
  nameEn: string;
  nameHi: string;
  category: Category;
  drySubtype?: DrySubtype;
  hazard: HazardLevel;
  confidence: number; // 0..1
  confidenceReason: string; // <= 12 words
  alternatives: {
    category: Category;
    name: string;
    p: number;
  }[];
  steps: string[]; // <= 3
  why: string;
  overriddenByRules?: boolean;
}

export interface ScanResponse {
  scene: SceneType;
  needsRetake: boolean;
  retakeHint?: string;
  items: ScannedItem[];
}

export interface ScanFeedback {
  confirmed?: boolean;
  correctedCategory?: Category;
  correctedName?: string;
  note?: string;
  conflictsWithRules?: boolean;
  updatedAt?: number;
}

export interface ScanRecord {
  id: string;
  timestamp: number;
  language: 'en' | 'hi';
  source: 'photo' | 'text';
  thumbnail?: string; // 160px JPEG base64 (optional)
  modelId: string;
  items: ScannedItem[];
  feedback?: ScanFeedback;
}

export interface AppSettings {
  language: 'en' | 'hi';
  modelScan: string;
  modelSmart: string;
  saveThumbnails: boolean;
  hasSeenPrivacyNotice: boolean;
  shareWithCommunity: boolean; // default false
}

export type SiteKind = 'bin_pair' | 'large_site' | 'community';

export interface Site {
  id: string;
  kind: SiteKind;
  name: string;
  area?: string;
  px?: [number, number]; // position on the map image [x, y]
  latlng?: [number, number]; // [lat, lng]
  latlngSource: 'georef' | 'gps_pinned' | 'user_entered';
  accepts: Category[];
  acceptsVerified: boolean;
  address?: string;
  phone?: string | null;
  hours?: string | null;
  notes?: string;
  addedBy: 'seed' | 'user';
  confirmations: number;
  reports: number;
  createdAt: number;
  authorId?: string;
  status?: 'active' | 'hidden';
}

export interface ContactEntry {
  id: string;
  titleEn: string;
  titleHi: string;
  subtitleEn: string;
  subtitleHi: string;
  phone?: string;
  address?: string;
}
