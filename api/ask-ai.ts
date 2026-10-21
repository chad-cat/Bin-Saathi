import { askWasteTextServer } from '../src/services/gemini';
import { handleGeminiError } from './_lib/errors';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { text, lang, modelId, userLessons } = req.body || {};
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text is required' });
  const l = lang === 'hi' ? 'hi' : 'en';
  try {
    const result = await askWasteTextServer({ text, lang: l, modelId, userLessons });
    res.json(result);
  } catch (err) {
    handleGeminiError(err, res, l);
  }
}