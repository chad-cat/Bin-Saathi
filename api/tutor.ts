import { askWasteTutorServer } from '../src/services/gemini';
import { handleGeminiError } from './_lib/errors';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { message, history, lang, modelId } = req.body || {};
  if (!message || typeof message !== 'string') return res.status(400).json({ error: 'message is required' });
  const l = lang === 'hi' ? 'hi' : 'en';
  try {
    const reply = await askWasteTutorServer({ message, history, lang: l, modelId });
    res.json({ reply });
  } catch (err) {
    handleGeminiError(err, res, l);
  }
}