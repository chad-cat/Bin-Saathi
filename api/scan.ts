import { scanWasteImageServer } from '../src/services/gemini.js';
import { handleGeminiError } from './_lib/errors.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { imageBase64, mimeType, lang, modelId, userLessons } = req.body || {};
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' });
  const l = lang === 'hi' ? 'hi' : 'en';
  try {
    const result = await scanWasteImageServer({ imageBase64, mimeType, lang: l, modelId, userLessons });
    res.json(result);
  } catch (err) {
    handleGeminiError(err, res, l);
  }
}