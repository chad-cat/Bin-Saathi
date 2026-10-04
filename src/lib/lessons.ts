import { Category, ScanRecord } from '../types';

/**
 * Builds the compact LOCAL_LESSONS block for system prompt injection (Section 7).
 * At most about 400 tokens (~1600 characters).
 * - Up to 12 lines of the form "<nameEn>" -> <category> (confirmed or corrected n times),
 *   preferring items corrected more than once and the most recent.
 * - Up to 5 lines of the form AI said <A>, user said <B> (n times) for the most frequent confusions.
 * - Excludes any correction flagged conflictsWithRules.
 */
export function buildLocalLessons(records: ScanRecord[]): string {
  if (!records || records.length === 0) return '';

  interface ItemStat {
    nameEn: string;
    category: Category;
    count: number;
    correctedCount: number;
    latestTimestamp: number;
  }

  const itemsMap = new Map<string, ItemStat>();
  const confusionsMap = new Map<string, { from: Category; to: Category; count: number }>();

  for (const record of records) {
    const feedback = record.feedback;
    if (!feedback) continue;

    // Exclude any feedback flagged conflictsWithRules
    if (feedback.conflictsWithRules) continue;

    const primaryItem = record.items[0];
    if (!primaryItem) continue;

    const nameEn = (feedback.correctedName || primaryItem.nameEn || primaryItem.itemKey || 'Item').trim();
    const aiCategory = primaryItem.category;

    if (feedback.correctedCategory) {
      const userCat = feedback.correctedCategory;
      const key = `${nameEn.toLowerCase()}_${userCat}`;
      const existing = itemsMap.get(key) || {
        nameEn,
        category: userCat,
        count: 0,
        correctedCount: 0,
        latestTimestamp: record.timestamp,
      };
      existing.count += 1;
      existing.correctedCount += 1;
      existing.latestTimestamp = Math.max(existing.latestTimestamp, record.timestamp);
      itemsMap.set(key, existing);

      // Track confusion pair
      if (aiCategory !== userCat) {
        const confKey = `${aiCategory}->${userCat}`;
        const conf = confusionsMap.get(confKey) || { from: aiCategory, to: userCat, count: 0 };
        conf.count += 1;
        confusionsMap.set(confKey, conf);
      }
    } else if (feedback.confirmed) {
      const key = `${nameEn.toLowerCase()}_${aiCategory}`;
      const existing = itemsMap.get(key) || {
        nameEn,
        category: aiCategory,
        count: 0,
        correctedCount: 0,
        latestTimestamp: record.timestamp,
      };
      existing.count += 1;
      existing.latestTimestamp = Math.max(existing.latestTimestamp, record.timestamp);
      itemsMap.set(key, existing);
    }
  }

  if (itemsMap.size === 0 && confusionsMap.size === 0) return '';

  // 1. Sort items: items corrected > 1 times first, then by total count, then by most recent
  const sortedItems = Array.from(itemsMap.values()).sort((a, b) => {
    const aMulti = a.correctedCount > 1 ? 1 : 0;
    const bMulti = b.correctedCount > 1 ? 1 : 0;
    if (aMulti !== bMulti) return bMulti - aMulti;
    if (b.count !== a.count) return b.count - a.count;
    return b.latestTimestamp - a.latestTimestamp;
  });

  const topItems = sortedItems.slice(0, 12);
  const itemLines = topItems.map((item) => {
    const type = item.correctedCount > 0 ? 'corrected' : 'confirmed';
    return `"${item.nameEn}" -> ${item.category} (${type} ${item.count} time${item.count > 1 ? 's' : ''})`;
  });

  // 2. Sort confusions by count descending (up to 5 lines)
  const sortedConfusions = Array.from(confusionsMap.values()).sort((a, b) => b.count - a.count);
  const topConfusions = sortedConfusions.slice(0, 5);
  const confusionLines = topConfusions.map(
    (c) => `AI said ${c.from}, user said ${c.to} (${c.count} time${c.count > 1 ? 's' : ''})`
  );

  let output = '';
  if (itemLines.length > 0) {
    output += `[User Verified Feedback]\n${itemLines.join('\n')}\n`;
  }
  if (confusionLines.length > 0) {
    output += `[Common Misclassifications]\n${confusionLines.join('\n')}\n`;
  }

  output += 'Note: SWM Rules 2026 and statutory rules always take precedence over user corrections.';

  // Safeguard: clamp to ~1600 characters (~400 tokens)
  if (output.length > 1600) {
    return output.slice(0, 1600) + '...';
  }

  return output;
}

export interface AccuracyBandStat {
  n: number;
  confirmed: number;
  pct: number;
}

export interface AccuracyStats {
  totalScans: number;
  feedbackCount: number;
  confirmedCount: number;
  shareConfirmed: number;
  bands: {
    high: AccuracyBandStat;
    med: AccuracyBandStat;
    low: AccuracyBandStat;
  };
  topConfusions: {
    from: Category;
    to: Category;
    count: number;
  }[];
}

/**
 * Calculates calibration and observed accuracy metrics from on-device records.
 */
export function calculateAccuracyStats(records: ScanRecord[]): AccuracyStats {
  const totalScans = records.length;
  let feedbackCount = 0;
  let confirmedCount = 0;

  const bandCounts = {
    high: { n: 0, confirmed: 0 },
    med: { n: 0, confirmed: 0 },
    low: { n: 0, confirmed: 0 },
  };

  const confusionsMap = new Map<string, { from: Category; to: Category; count: number }>();

  for (const r of records) {
    const feedback = r.feedback;
    if (!feedback) continue;

    // Has user feedback (either confirmed or corrected)
    feedbackCount += 1;
    const isConfirmed = Boolean(feedback.confirmed);
    if (isConfirmed) confirmedCount += 1;

    const primary = r.items[0];
    const conf = primary?.confidence ?? 0.5;

    let band: 'high' | 'med' | 'low' = 'med';
    if (conf >= 0.8) band = 'high';
    else if (conf < 0.55) band = 'low';

    bandCounts[band].n += 1;
    if (isConfirmed) {
      bandCounts[band].confirmed += 1;
    }

    if (feedback.correctedCategory && primary) {
      const from = primary.category;
      const to = feedback.correctedCategory;
      if (from !== to) {
        const key = `${from}->${to}`;
        const item = confusionsMap.get(key) || { from, to, count: 0 };
        item.count += 1;
        confusionsMap.set(key, item);
      }
    }
  }

  const shareConfirmed = feedbackCount > 0 ? Math.round((confirmedCount / feedbackCount) * 100) : 0;

  const calcBand = (b: { n: number; confirmed: number }): AccuracyBandStat => ({
    n: b.n,
    confirmed: b.confirmed,
    pct: b.n > 0 ? Math.round((b.confirmed / b.n) * 100) : 0,
  });

  const sortedConfusions = Array.from(confusionsMap.values()).sort((a, b) => b.count - a.count);

  return {
    totalScans,
    feedbackCount,
    confirmedCount,
    shareConfirmed,
    bands: {
      high: calcBand(bandCounts.high),
      med: calcBand(bandCounts.med),
      low: calcBand(bandCounts.low),
    },
    topConfusions: sortedConfusions.slice(0, 3),
  };
}

/**
 * Formats scan records into a clean, downloadable CSV dataset.
 */
export function exportRecordsToCsv(records: ScanRecord[]): string {
  const headers = [
    'id',
    'timestamp',
    'date',
    'language',
    'source',
    'modelId',
    'nameEn',
    'nameHi',
    'category',
    'confidence',
    'feedbackConfirmed',
    'correctedCategory',
    'correctedName',
    'conflictsWithRules',
  ];

  const rows = records.map((r) => {
    const item = r.items[0];
    const fb = r.feedback;
    const dateStr = new Date(r.timestamp).toISOString();

    const escape = (val: unknown) => {
      const s = String(val ?? '').replace(/"/g, '""');
      return `"${s}"`;
    };

    return [
      escape(r.id),
      r.timestamp,
      escape(dateStr),
      escape(r.language),
      escape(r.source),
      escape(r.modelId),
      escape(item?.nameEn || ''),
      escape(item?.nameHi || ''),
      escape(item?.category || ''),
      item?.confidence != null ? item.confidence.toFixed(2) : '',
      fb?.confirmed ? '1' : '0',
      escape(fb?.correctedCategory || ''),
      escape(fb?.correctedName || ''),
      fb?.conflictsWithRules ? '1' : '0',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
