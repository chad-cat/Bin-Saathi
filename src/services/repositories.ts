import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  increment,
  query,
  where,
} from 'firebase/firestore';
import { db, ensureAnonymousAuth } from './firebase';
import { storageService } from './storage';
import { Category, Site } from '../types';

export interface SiteRepository {
  getSites(): Promise<Site[]>;
  addSite(site: Omit<Site, 'id' | 'createdAt' | 'confirmations' | 'reports'>): Promise<Site>;
  confirmSite(siteId: string): Promise<{ success: boolean; newCount: number; message?: string }>;
  reportSite(siteId: string, reason?: string): Promise<{ success: boolean; newCount: number; hidden: boolean }>;
  getUserSiteInteraction(siteId: string): Promise<{ confirmed: boolean; reported: boolean }>;
}

export interface FeedbackRepository {
  submitCorrection(params: {
    itemName: string;
    category: string;
    previousCategory?: string;
  }): Promise<void>;
}

// ==========================================
// LOCAL REPOSITORY (Default on-device storage)
// ==========================================

const LOCAL_CONFIRMATIONS_KEY = 'bin_saathi_local_confirmations';
const LOCAL_REPORTS_KEY = 'bin_saathi_local_reports';

function getLocalConfirmedIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_CONFIRMATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getLocalReportedIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export class LocalSiteRepository implements SiteRepository {
  async getSites(): Promise<Site[]> {
    const all = storageService.getSites();
    // Requirement 3: A site with 3 or more reports is hidden from lists until reviewed
    return all.filter((s) => (s.reports || 0) < 3 && s.status !== 'hidden');
  }

  async addSite(siteData: Omit<Site, 'id' | 'createdAt' | 'confirmations' | 'reports'>): Promise<Site> {
    const newSite: Site = {
      ...siteData,
      id: `local_site_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      addedBy: 'user',
      confirmations: 1, // creator confirms it
      reports: 0,
      createdAt: Date.now(),
      status: 'active',
    };

    storageService.saveSite(newSite);

    // Track that the current user confirmed their own created site
    const confirmed = getLocalConfirmedIds();
    if (!confirmed.includes(newSite.id)) {
      localStorage.setItem(LOCAL_CONFIRMATIONS_KEY, JSON.stringify([...confirmed, newSite.id]));
    }

    return newSite;
  }

  async confirmSite(siteId: string): Promise<{ success: boolean; newCount: number; message?: string }> {
    const confirmed = getLocalConfirmedIds();
    if (confirmed.includes(siteId)) {
      const site = storageService.getSites().find((s) => s.id === siteId);
      return { success: false, newCount: site?.confirmations || 1, message: 'Already confirmed' };
    }

    storageService.confirmSite(siteId);
    localStorage.setItem(LOCAL_CONFIRMATIONS_KEY, JSON.stringify([...confirmed, siteId]));

    const site = storageService.getSites().find((s) => s.id === siteId);
    return { success: true, newCount: site?.confirmations || 1 };
  }

  async reportSite(siteId: string): Promise<{ success: boolean; newCount: number; hidden: boolean }> {
    const reported = getLocalReportedIds();
    if (reported.includes(siteId)) {
      const site = storageService.getSites().find((s) => s.id === siteId);
      return { success: false, newCount: site?.reports || 1, hidden: (site?.reports || 0) >= 3 };
    }

    storageService.reportSite(siteId);
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify([...reported, siteId]));

    const site = storageService.getSites().find((s) => s.id === siteId);
    const newReports = site?.reports || 1;
    const isHidden = newReports >= 3;

    if (isHidden && site) {
      storageService.updateSite({ ...site, status: 'hidden' });
    }

    return { success: true, newCount: newReports, hidden: isHidden };
  }

  async getUserSiteInteraction(siteId: string): Promise<{ confirmed: boolean; reported: boolean }> {
    const confirmed = getLocalConfirmedIds();
    const reported = getLocalReportedIds();
    return {
      confirmed: confirmed.includes(siteId),
      reported: reported.includes(siteId),
    };
  }
}

export class LocalFeedbackRepository implements FeedbackRepository {
  async submitCorrection(): Promise<void> {
    // Local corrections are already handled by storageService scan feedback records
  }
}

// ==========================================
// FIREBASE FIRESTORE REPOSITORY (Community Shared)
// ==========================================

export class FirebaseSiteRepository implements SiteRepository {
  async getSites(): Promise<Site[]> {
    try {
      // 1. Get seed sites from local storage / catalog
      const seedSites = storageService.getSites().filter((s) => s.addedBy === 'seed');

      // 2. Fetch community sites from Firestore
      await ensureAnonymousAuth();
      const sitesRef = collection(db, 'sites');
      const q = query(sitesRef, where('status', '==', 'active'));
      const snapshot = await getDocs(q);

      const communitySites: Site[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const reportCount = data.reportCount ?? data.reports ?? 0;
        // Requirement 3: A site with 3 or more reports is hidden from lists until reviewed
        if (reportCount >= 3) return;

        const confirmationCount = data.confirmationCount ?? data.confirmations ?? 1;

        // Requirement 2: A site shows as "Verified" only after 3 different anonymous users confirm it;
        // before that it shows "Added by a user"
        const isVerified = confirmationCount >= 3;

        communitySites.push({
          id: docSnap.id,
          name: data.name || 'Community Bin',
          kind: 'community',
          accepts: [data.category as Category],
          acceptsVerified: isVerified,
          latlng: data.lat && data.lng ? [data.lat, data.lng] : undefined,
          latlngSource: 'user_entered',
          notes: data.notes || '',
          addedBy: 'user',
          confirmations: confirmationCount,
          reports: reportCount,
          createdAt: data.createdAt || Date.now(),
          authorId: data.authorId,
          status: data.status || 'active',
        });
      });

      // Combine seed sites with active community sites
      return [...seedSites, ...communitySites];
    } catch (err) {
      console.warn('[FirebaseSiteRepository] Failed to fetch community sites, falling back to local:', err);
      return storageService.getSites().filter((s) => (s.reports || 0) < 3);
    }
  }

  async addSite(siteData: Omit<Site, 'id' | 'createdAt' | 'confirmations' | 'reports'>): Promise<Site> {
    const user = await ensureAnonymousAuth();
    const siteId = `site_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const lat = siteData.latlng ? siteData.latlng[0] : 29.8649;
    const lng = siteData.latlng ? siteData.latlng[1] : 77.8966;
    const category = siteData.accepts[0] || 'dry';

    const firestorePayload = {
      id: siteId,
      name: siteData.name,
      category,
      lat,
      lng,
      notes: siteData.notes || '',
      authorId: user.uid,
      createdAt: Date.now(),
      confirmationCount: 1, // author is 1st confirmation
      reportCount: 0,
      status: 'active',
    };

    // 1. Write the site document
    const siteDocRef = doc(db, 'sites', siteId);
    await setDoc(siteDocRef, firestorePayload);

    // 2. Write author confirmation document: /sites/{siteId}/confirmations/{siteId}_{userId}
    // Enforcing 1 confirmation per user per site by doc ID (siteId + userId)
    const confDocId = `${siteId}_${user.uid}`;
    const confDocRef = doc(db, 'sites', siteId, 'confirmations', confDocId);
    await setDoc(confDocRef, {
      siteId,
      userId: user.uid,
      createdAt: Date.now(),
    });

    const createdSite: Site = {
      ...siteData,
      id: siteId,
      addedBy: 'user',
      confirmations: 1,
      reports: 0,
      createdAt: Date.now(),
      authorId: user.uid,
      status: 'active',
      acceptsVerified: false, // requires 3 confirmations to be verified
    };

    // Also mirror to local storage cache
    storageService.saveSite(createdSite);

    return createdSite;
  }

  async confirmSite(siteId: string): Promise<{ success: boolean; newCount: number; message?: string }> {
    const user = await ensureAnonymousAuth();

    // Requirement 2: One confirmation or report per user per site, enforced by document ID (siteId + userId)
    const confDocId = `${siteId}_${user.uid}`;
    const confDocRef = doc(db, 'sites', siteId, 'confirmations', confDocId);

    const existingConf = await getDoc(confDocRef);
    if (existingConf.exists()) {
      return { success: false, newCount: 0, message: 'You have already confirmed this site' };
    }

    // Write confirmation document
    await setDoc(confDocRef, {
      siteId,
      userId: user.uid,
      createdAt: Date.now(),
    });

    // Increment confirmation count on site document
    const siteDocRef = doc(db, 'sites', siteId);
    await updateDoc(siteDocRef, {
      confirmationCount: increment(1),
    });

    const updatedSiteSnap = await getDoc(siteDocRef);
    const newCount = updatedSiteSnap.data()?.confirmationCount || 1;

    // Update local cache
    storageService.confirmSite(siteId);

    return { success: true, newCount };
  }

  async reportSite(siteId: string, reason: string = 'problem'): Promise<{ success: boolean; newCount: number; hidden: boolean }> {
    const user = await ensureAnonymousAuth();

    // Requirement 2 & 3: One report per user per site, enforced by document ID (siteId + userId)
    const reportDocId = `${siteId}_${user.uid}`;
    const reportDocRef = doc(db, 'sites', siteId, 'reports', reportDocId);

    const existingReport = await getDoc(reportDocRef);
    if (existingReport.exists()) {
      return { success: false, newCount: 0, hidden: false };
    }

    // Write report document
    await setDoc(reportDocRef, {
      siteId,
      userId: user.uid,
      reason,
      createdAt: Date.now(),
    });

    // Update report count on site document
    const siteDocRef = doc(db, 'sites', siteId);
    const siteSnap = await getDoc(siteDocRef);
    const currentReports = siteSnap.data()?.reportCount || 0;
    const newReports = currentReports + 1;
    const shouldHide = newReports >= 3;

    await updateDoc(siteDocRef, {
      reportCount: increment(1),
      ...(shouldHide ? { status: 'hidden' } : {}),
    });

    // Update local cache
    storageService.reportSite(siteId);

    return { success: true, newCount: newReports, hidden: shouldHide };
  }

  async getUserSiteInteraction(siteId: string): Promise<{ confirmed: boolean; reported: boolean }> {
    try {
      const user = await ensureAnonymousAuth();
      const confDocRef = doc(db, 'sites', siteId, 'confirmations', `${siteId}_${user.uid}`);
      const reportDocRef = doc(db, 'sites', siteId, 'reports', `${siteId}_${user.uid}`);

      const [confSnap, reportSnap] = await Promise.all([
        getDoc(confDocRef),
        getDoc(reportDocRef),
      ]);

      return {
        confirmed: confSnap.exists(),
        reported: reportSnap.exists(),
      };
    } catch {
      return { confirmed: false, reported: false };
    }
  }
}

export class FirebaseFeedbackRepository implements FeedbackRepository {
  /**
   * Requirement 5: Do not store photos or personal information in Firestore.
   * Corrections are stored as item name + category only.
   */
  async submitCorrection(params: {
    itemName: string;
    category: string;
    previousCategory?: string;
  }): Promise<void> {
    try {
      const user = await ensureAnonymousAuth();
      const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      const docRef = doc(db, 'feedbacks', feedbackId);
      await setDoc(docRef, {
        id: feedbackId,
        userId: user.uid,
        itemName: params.itemName.trim(),
        category: params.category,
        previousCategory: params.previousCategory || '',
        createdAt: Date.now(),
      });
    } catch (err) {
      console.warn('[FirebaseFeedbackRepository] Could not submit feedback to community:', err);
    }
  }
}

// Singletons & Factory
const localSiteRepo = new LocalSiteRepository();
const localFeedbackRepo = new LocalFeedbackRepository();
const firebaseSiteRepo = new FirebaseSiteRepository();
const firebaseFeedbackRepo = new FirebaseFeedbackRepository();

export function getSiteRepository(shareWithCommunity: boolean): SiteRepository {
  return shareWithCommunity ? firebaseSiteRepo : localSiteRepo;
}

export function getFeedbackRepository(shareWithCommunity: boolean): FeedbackRepository {
  return shareWithCommunity ? firebaseFeedbackRepo : localFeedbackRepo;
}
