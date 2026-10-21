import { GeminiAppError } from '../../src/services/gemini';

export function handleGeminiError(err: unknown, res: any, lang: 'en' | 'hi' = 'en') {
  console.error('[Gemini Server Technical Error]:', err);

  const busyEn = 'The AI is busy right now. Please try again in a moment.';
  const busyHi = 'AI अभी व्यस्त है। कृपया थोड़ी देर बाद फिर कोशिश करें।';
  const quotaEn = 'The free AI limit is reached for now. You can still search by name or pick a category.';
  const quotaHi = 'वर्तमान में निःशुल्क AI सीमा समाप्त हो गई है। आप नाम से खोज सकते हैं या श्रेणी चुन सकते हैं।';

  let isQuota: boolean;
  let status: number;

  if (err instanceof GeminiAppError) {
    isQuota = err.isQuota;
    status = err.statusCode;
  } else {
    const s = String(err).toLowerCase();
    isQuota = s.includes('429') || s.includes('quota') || s.includes('resource_exhausted');
    status = isQuota ? 429 : 503;
  }

  const msg = isQuota ? (lang === 'hi' ? quotaHi : quotaEn) : (lang === 'hi' ? busyHi : busyEn);
  return res.status(status).json({ error: msg, isQuotaError: isQuota, isBusy: !isQuota });
}