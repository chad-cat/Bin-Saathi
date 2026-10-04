import { storageService } from './storage';
import { ScanResponse } from '../types';

export interface ScanApiResult {
  data?: ScanResponse;
  error?: string;
  isQuotaError?: boolean;
  isBusy?: boolean;
  fromCache?: boolean;
}

export async function callScanPhotoApi(params: {
  imageBase64: string;
  mimeType?: string;
  lang: 'en' | 'hi';
  modelId?: string;
  imageHash?: string;
  userLessons?: string;
}): Promise<ScanApiResult> {
  const { imageBase64, mimeType = 'image/jpeg', lang, modelId, imageHash, userLessons } = params;

  // 1. Check local hash cache first (Section 5.2)
  if (imageHash) {
    const cached = storageService.getCachedScan(imageHash);
    if (cached) {
      return { data: cached, fromCache: true };
    }
  }

  // 2. Network request to backend API route
  try {
    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        mimeType,
        lang,
        modelId,
        userLessons,
      }),
    });

    const isQuota = res.status === 429;
    const isBusy = res.status === 503 || res.status === 500 || res.status === 504;

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        error:
          errJson.error ||
          (isQuota
            ? (lang === 'hi'
                ? 'वर्तमान में निःशुल्क AI सीमा समाप्त हो गई है। आप नाम से खोज सकते हैं या श्रेणी चुन सकते हैं।'
                : 'The free AI limit is reached for now. You can still search by name or pick a category.')
            : (lang === 'hi'
                ? 'AI अभी व्यस्त है। कृपया थोड़ी देर बाद फिर कोशिश करें।'
                : 'The AI is busy right now. Please try again in a moment.')),
        isQuotaError: Boolean(errJson.isQuotaError || isQuota),
        isBusy: Boolean(errJson.isBusy || isBusy),
      };
    }

    const data: ScanResponse = await res.json();

    // Cache successful response
    if (imageHash && data.scene === 'items') {
      storageService.setCachedScan(imageHash, data);
    }

    // Increment daily AI counter ONLY on successful calls (Requirement 8)
    storageService.incrementDailyAiCount();

    return { data };
  } catch (err: unknown) {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    return {
      error: isOffline
        ? (lang === 'hi'
            ? 'आप अभी ऑफ़लाइन हैं। स्थानीय खोज पूरी तरह उपलब्ध है।'
            : 'You are currently offline. Local search remains available.')
        : (lang === 'hi'
            ? 'AI अभी व्यस्त है। कृपया थोड़ी देर बाद फिर कोशिश करें।'
            : 'The AI is busy right now. Please try again in a moment.'),
      isBusy: true,
    };
  }
}

export async function callAskAiTextApi(params: {
  text: string;
  lang: 'en' | 'hi';
  modelId?: string;
  userLessons?: string;
}): Promise<ScanApiResult> {
  const { text, lang, modelId, userLessons } = params;

  try {
    const res = await fetch('/api/ask-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        lang,
        modelId,
        userLessons,
      }),
    });

    const isQuota = res.status === 429;
    const isBusy = res.status === 503 || res.status === 500 || res.status === 504;

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        error:
          errJson.error ||
          (isQuota
            ? (lang === 'hi'
                ? 'वर्तमान में निःशुल्क AI सीमा समाप्त हो गई है। आप नाम से खोज सकते हैं या श्रेणी चुन सकते हैं।'
                : 'The free AI limit is reached for now. You can still search by name or pick a category.')
            : (lang === 'hi'
                ? 'AI अभी व्यस्त है। कृपया थोड़ी देर बाद फिर कोशिश करें।'
                : 'The AI is busy right now. Please try again in a moment.')),
        isQuotaError: Boolean(errJson.isQuotaError || isQuota),
        isBusy: Boolean(errJson.isBusy || isBusy),
      };
    }

    const data: ScanResponse = await res.json();
    // Increment daily AI counter ONLY on successful calls (Requirement 8)
    storageService.incrementDailyAiCount();
    return { data };
  } catch (err: unknown) {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    return {
      error: isOffline
        ? (lang === 'hi'
            ? 'आप अभी ऑफ़लाइन हैं। स्थानीय खोज पूरी तरह उपलब्ध है।'
            : 'You are currently offline. Local search remains available.')
        : (lang === 'hi'
            ? 'AI अभी व्यस्त है। कृपया थोड़ी देर बाद फिर कोशिश करें।'
            : 'The AI is busy right now. Please try again in a moment.'),
      isBusy: true,
    };
  }
}

export interface TutorApiResult {
  reply?: string;
  error?: string;
  isQuotaError?: boolean;
  isBusy?: boolean;
}

export async function callTutorApi(params: {
  message: string;
  history?: { role: 'user' | 'model'; text: string }[];
  lang: 'en' | 'hi';
  modelId?: string;
}): Promise<TutorApiResult> {
  const { message, history, lang, modelId } = params;

  try {
    const res = await fetch('/api/tutor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history,
        lang,
        modelId,
      }),
    });

    const isQuota = res.status === 429;
    const isBusy = res.status === 503 || res.status === 500 || res.status === 504;

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        error:
          errJson.error ||
          (isQuota
            ? (lang === 'hi'
                ? 'वर्तमान में निःशुल्क AI सीमा समाप्त हो गई है। आप नाम से खोज सकते हैं या श्रेणी चुन सकते हैं।'
                : 'The free AI limit is reached for now. You can still search by name or pick a category.')
            : (lang === 'hi'
                ? 'AI अभी व्यस्त है। कृपया थोड़ी देर बाद फिर कोशिश करें।'
                : 'The AI is busy right now. Please try again in a moment.')),
        isQuotaError: Boolean(errJson.isQuotaError || isQuota),
        isBusy: Boolean(errJson.isBusy || isBusy),
      };
    }

    const json = await res.json();
    // Increment daily AI counter ONLY on successful calls (Requirement 8)
    storageService.incrementDailyAiCount();
    return { reply: json.reply };
  } catch (err: unknown) {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    return {
      error: isOffline
        ? (lang === 'hi'
            ? 'आप अभी ऑफ़लाइन हैं। कृपया इंटरनेट कनेक्शन जांचें।'
            : 'You are currently offline. Please check your network connection.')
        : (lang === 'hi'
            ? 'AI अभी व्यस्त है। कृपया थोड़ी देर बाद फिर कोशिश करें।'
            : 'The AI is busy right now. Please try again in a moment.'),
      isBusy: true,
    };
  }
}
