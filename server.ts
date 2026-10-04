import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import {
  scanWasteImageServer,
  askWasteTextServer,
  askWasteTutorServer,
  GeminiAppError,
} from './src/services/gemini';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Bin Saathi', rulesVersion: 'SWM 2026' });
});

/**
 * Shared error handler: Never leaks raw API errors or JSON to the client.
 * Logs full technical details to console and returns clean localized error messages.
 */
function handleGeminiServerError(err: unknown, res: express.Response, lang: 'en' | 'hi' = 'en') {
  console.error('[Gemini Server Technical Error]:', err);

  const busyEn = 'The AI is busy right now. Please try again in a moment.';
  const busyHi = 'AI अभी व्यस्त है। कृपया थोड़ी देर बाद फिर कोशिश करें।';
  const quotaEn = 'The free AI limit is reached for now. You can still search by name or pick a category.';
  const quotaHi = 'वर्तमान में निःशुल्क AI सीमा समाप्त हो गई है। आप नाम से खोज सकते हैं या श्रेणी चुन सकते हैं।';

  if (err instanceof GeminiAppError) {
    const isQuota = err.isQuota;
    const msg = isQuota ? (lang === 'hi' ? quotaHi : quotaEn) : (lang === 'hi' ? busyHi : busyEn);
    return res.status(err.statusCode).json({
      error: msg,
      isQuotaError: isQuota,
      isBusy: !isQuota,
    });
  }

  const errStr = String(err).toLowerCase();
  const isQuota =
    errStr.includes('429') || errStr.includes('quota') || errStr.includes('resource_exhausted');
  const msg = isQuota ? (lang === 'hi' ? quotaHi : quotaEn) : (lang === 'hi' ? busyHi : busyEn);

  return res.status(isQuota ? 429 : 503).json({
    error: msg,
    isQuotaError: isQuota,
    isBusy: !isQuota,
  });
}

// POST /api/scan
app.post('/api/scan', async (req, res) => {
  const { imageBase64, mimeType, lang, modelId, userLessons } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  try {
    const result = await scanWasteImageServer({
      imageBase64,
      mimeType,
      lang: lang === 'hi' ? 'hi' : 'en',
      modelId,
      userLessons,
    });

    res.json(result);
  } catch (err: unknown) {
    handleGeminiServerError(err, res, lang === 'hi' ? 'hi' : 'en');
  }
});

// POST /api/ask-ai
app.post('/api/ask-ai', async (req, res) => {
  const { text, lang, modelId, userLessons } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' });
  }

  try {
    const result = await askWasteTextServer({
      text,
      lang: lang === 'hi' ? 'hi' : 'en',
      modelId,
      userLessons,
    });

    res.json(result);
  } catch (err: unknown) {
    handleGeminiServerError(err, res, lang === 'hi' ? 'hi' : 'en');
  }
});

// POST /api/tutor (Section 5.9 Tutor Chat)
app.post('/api/tutor', async (req, res) => {
  const { message, history, lang, modelId } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    const reply = await askWasteTutorServer({
      message,
      history,
      lang: lang === 'hi' ? 'hi' : 'en',
      modelId,
    });

    res.json({ reply });
  } catch (err: unknown) {
    handleGeminiServerError(err, res, lang === 'hi' ? 'hi' : 'en');
  }
});

// Setup Vite middleware in development or static assets in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Bin Saathi server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
