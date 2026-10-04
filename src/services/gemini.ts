import { GoogleGenAI, Type } from '@google/genai';
import {
  EXTENDED_DIGEST,
  FALLBACK_MODEL,
  MODEL_FALLBACK_CHAIN,
  MODEL_SCAN,
  MODEL_SMART,
  SWM_DIGEST,
} from '../config';
import { LOCAL_RULES } from '../data/rules';
import { Category, ScanResponse, ScannedItem } from '../types';

// Read API key from environment in this module as required
const apiKey = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Build compact LOCAL_RULES string for system prompt injection
const compactRulesSummary = Object.values(LOCAL_RULES)
  .map((r) => `${r.itemKey}:${r.category}${r.drySubtype ? `(${r.drySubtype})` : ''}`)
  .join(', ');

export function buildSystemInstruction(lang: 'en' | 'hi', userLessons: string = ''): string {
  const langText = lang === 'hi' ? 'Hindi (Devanagari, simple everyday Hindi)' : 'English';

  return `You are the waste-identification engine of "Bin Saathi", an app for people in India (specifically the IIT Roorkee campus).
You receive a photo or a short text naming one or more waste items. Decide, for each item, where it should go.

RULES
1. Use ONLY the legal basis in SWM_DIGEST and EXTENDED_DIGEST below. Never invent rule numbers, bin colours, helplines, addresses or phone numbers.
2. Choose exactly one \`category\` per item from the allowed enum. If a LOCAL_RULES entry matches the item, use its category.
3. Safety first. Never place something that could be a battery, e-waste, medicine, sharps, chemical, aerosol or sanitary item into a harmless category just because the photo is unclear. If it could be hazardous, say so in \`alternatives\`.
4. If the photo shows no waste (a person, a face, a document, a screen, an empty scene), set scene to "not_waste" and return no items. Never describe or identify people.
5. If the image is too blurry, dark or partial to judge, set needs_retake=true and give a one-sentence retake_hint.
6. Confidence rubric (0 to 1). 0.85+ only when the item and material are clearly visible and it has one destination. 0.55-0.8 when the material is ambiguous (foil vs metallised film), the item is heavily soiled, or only partly visible. Below 0.55 when you are guessing. Do not give 0.95+ unless the item is unmistakable.
7. \`steps\`: at most 3 short imperative sentences in ${langText}, practical and specific (rinse, flatten, wrap, keep separate). Plain everyday words, no jargon.
8. \`why\`: one sentence in ${langText} naming the category's basis, e.g. "Special care waste under SWM Rules 2026 (waste batteries)". Cite only rules that appear in the digests.
9. Item names in both English and Hindi.
10. If the item is still usable (clothes, books, working electronics) set category to the right waste route but add "reuse or donate first" as step 1.
11. Output JSON only, matching the schema. No prose.

SWM_DIGEST:
${SWM_DIGEST}

EXTENDED_DIGEST:
${EXTENDED_DIGEST}

LOCAL_RULES:
${compactRulesSummary}

LOCAL_LESSONS:
${userLessons}`;
}

export const SCAN_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    scene: {
      type: Type.STRING,
      enum: ['items', 'not_waste', 'unclear'],
      description: 'Whether waste items, not waste (person/screen/doc), or unclear',
    },
    needsRetake: {
      type: Type.BOOLEAN,
      description: 'True if blurry, too dark, or unclear',
    },
    retakeHint: {
      type: Type.STRING,
      description: 'One sentence hint if retake needed',
    },
    items: {
      type: Type.ARRAY,
      description: 'Up to 4 identified items in photo, dominant item first',
      items: {
        type: Type.OBJECT,
        properties: {
          itemKey: {
            type: Type.STRING,
            description: 'Matching itemKey from LOCAL_RULES if found, else snake_case guess',
          },
          nameEn: {
            type: Type.STRING,
            description: 'Item name in English',
          },
          nameHi: {
            type: Type.STRING,
            description: 'Item name in Hindi (Devanagari)',
          },
          category: {
            type: Type.STRING,
            enum: [
              'wet',
              'dry',
              'sanitary',
              'special_care',
              'e_waste',
              'battery',
              'horticulture',
              'c_and_d',
              'biomedical',
              'hazardous',
              'reuse_donate',
              'unknown',
            ],
            description: 'Waste category',
          },
          drySubtype: {
            type: Type.STRING,
            enum: ['recyclable', 'non_recyclable', 'inert'],
            description: 'Subtype if dry waste',
          },
          hazard: {
            type: Type.STRING,
            enum: ['none', 'low', 'high'],
            description: 'Hazard level',
          },
          confidence: {
            type: Type.NUMBER,
            description: 'Confidence between 0 and 1',
          },
          confidenceReason: {
            type: Type.STRING,
            description: 'At most 12 words reason for confidence score',
          },
          alternatives: {
            type: Type.ARRAY,
            description: 'Up to 3 alternative interpretations',
            items: {
              type: Type.OBJECT,
              properties: {
                category: {
                  type: Type.STRING,
                  enum: [
                    'wet',
                    'dry',
                    'sanitary',
                    'special_care',
                    'e_waste',
                    'battery',
                    'horticulture',
                    'c_and_d',
                    'biomedical',
                    'hazardous',
                    'reuse_donate',
                    'unknown',
                  ],
                },
                name: { type: Type.STRING },
                p: { type: Type.NUMBER },
              },
              required: ['category', 'name', 'p'],
            },
          },
          steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'At most 3 short disposal steps in requested language',
          },
          why: {
            type: Type.STRING,
            description: 'One sentence basis mentioning legal rules',
          },
        },
        required: [
          'itemKey',
          'nameEn',
          'nameHi',
          'category',
          'hazard',
          'confidence',
          'confidenceReason',
          'steps',
          'why',
        ],
      },
    },
  },
  required: ['scene', 'needsRetake', 'items'],
};

// Allowed statutory rule citation regex / keywords from Appendix A and B
const ALLOWED_RULE_CITATIONS = [
  'rule 2', 'rule 3', 'rule 5', 'rule 6', 'rule 8', 'rule 9', 'rule 13', 'rule 14', 'rule 39',
  'swm', '2026', 'e-waste', 'battery', '2022', '2016', 'c&d', '2025', 'hierarchy'
];

function sanitizeWhyText(why: string, category: Category, lang: 'en' | 'hi'): string {
  if (!why) return '';
  const lower = why.toLowerCase();
  
  // Check if any rule mentions are fabricated (e.g. Rule 47, Rule 112)
  const ruleNumMatches = lower.match(/rule\s+(\d+)/g);
  if (ruleNumMatches) {
    const allowedNumbers = ['2', '3', '5', '6', '8', '9', '13', '14', '39'];
    for (const match of ruleNumMatches) {
      const num = match.replace(/rule\s+/, '').trim();
      if (!allowedNumbers.includes(num)) {
        // Fabricated rule found: replace with clean legal basis
        if (lang === 'hi') {
          return `ठोस अपशिष्ट प्रबंधन नियम 2026 / संबंधित नियमों के अंतर्गत ${category}।`;
        }
        return `Classified under SWM Rules 2026 / applicable national statutory waste rules for ${category}.`;
      }
    }
  }

  return why;
}

/**
 * Validates and post-processes Gemini results against LOCAL_RULES (Section 5.6).
 */
export function postProcessScanResponse(raw: ScanResponse, lang: 'en' | 'hi'): ScanResponse {
  if (raw.scene === 'not_waste') {
    return {
      scene: 'not_waste',
      needsRetake: false,
      retakeHint: raw.retakeHint,
      items: [],
    };
  }

  const processedItems: ScannedItem[] = (raw.items || []).slice(0, 4).map((item) => {
    let category = item.category;
    let drySubtype = item.drySubtype;
    let hazard = item.hazard || 'none';
    let confidence = Math.max(0, Math.min(1, Number(item.confidence) || 0.5));
    let overriddenByRules = false;
    let steps = item.steps || [];
    let why = sanitizeWhyText(item.why || '', category, lang);

    // Rule 5.6: If itemKey exists in rules.ts and the model's category differs, the rules table wins!
    const ruleMatch = LOCAL_RULES[item.itemKey];
    if (ruleMatch) {
      if (ruleMatch.category !== category) {
        overriddenByRules = true;
        category = ruleMatch.category;
        drySubtype = ruleMatch.drySubtype;
        hazard = ruleMatch.hazard;
        // Cap displayed confidence at 0.70 when overridden
        confidence = Math.min(confidence, 0.70);
        
        // Provide verified steps and notes if available
        if (lang === 'hi' && ruleMatch.stepsHi) {
          steps = ruleMatch.stepsHi;
          why = ruleMatch.noteHi || `ठोस अपशिष्ट नियम 2026 के अंतर्गत ${category}।`;
        } else if (ruleMatch.stepsEn) {
          steps = ruleMatch.stepsEn;
          why = ruleMatch.noteEn || `SWM Rules 2026 statutory classification: ${category}.`;
        }
      } else {
        // Inherit exact hazard and subtype from rules table
        hazard = ruleMatch.hazard;
        if (ruleMatch.drySubtype && !drySubtype) {
          drySubtype = ruleMatch.drySubtype;
        }
      }
    }

    // Sort alternatives by probability descending
    const alts = (item.alternatives || [])
      .map((a) => ({
        category: a.category,
        name: a.name || a.category,
        p: Math.max(0, Math.min(1, Number(a.p) || 0)),
      }))
      .sort((a, b) => b.p - a.p);

    // Ensure steps is at most 3
    steps = steps.slice(0, 3);

    return {
      ...item,
      category,
      drySubtype,
      hazard,
      confidence,
      confidenceReason: item.confidenceReason || '',
      alternatives: alts,
      steps,
      why,
      overriddenByRules,
    };
  });

  return {
    scene: raw.scene || (processedItems.length > 0 ? 'items' : 'unclear'),
    needsRetake: Boolean(raw.needsRetake),
    retakeHint: raw.retakeHint,
    items: processedItems,
  };
}

export class GeminiAppError extends Error {
  isQuota: boolean;
  isTransient: boolean;
  statusCode: number;

  constructor(message: string, isQuota: boolean, isTransient: boolean, statusCode: number = 500) {
    super(message);
    this.name = 'GeminiAppError';
    this.isQuota = isQuota;
    this.isTransient = isTransient;
    this.statusCode = statusCode;
  }
}

/**
 * Checks if an error is transient (503, 500, 504, 429, timeouts, network failures).
 * Explicitly excludes 400, 401, 403, and safety-block errors.
 */
export function isTransientError(err: unknown): boolean {
  if (!err) return false;
  const str = String(err).toLowerCase();

  // Explicit non-transient status codes / conditions - do NOT retry
  if (
    str.includes('400') ||
    str.includes('invalid_argument') ||
    str.includes('401') ||
    str.includes('unauthenticated') ||
    str.includes('403') ||
    str.includes('permission_denied') ||
    str.includes('safety') ||
    str.includes('blocked')
  ) {
    return false;
  }

  // Transient indicators
  if (
    str.includes('503') ||
    str.includes('unavailable') ||
    str.includes('500') ||
    str.includes('internal') ||
    str.includes('504') ||
    str.includes('deadline_exceeded') ||
    str.includes('gateway timeout') ||
    str.includes('429') ||
    str.includes('resource_exhausted') ||
    str.includes('quota') ||
    str.includes('high demand') ||
    str.includes('temporarily unavailable') ||
    str.includes('timeout') ||
    str.includes('timed out') ||
    str.includes('etimedout') ||
    str.includes('econnreset') ||
    str.includes('econnrefused') ||
    str.includes('fetch failed') ||
    str.includes('network') ||
    str.includes('socket hang up')
  ) {
    return true;
  }

  return false;
}

export function getBackoffDelayMs(attempt: number): number {
  // attempt 0 -> ~1000ms + jitter
  // attempt 1 -> ~2000ms + jitter
  // attempt 2 -> ~4000ms + jitter
  const base = Math.pow(2, attempt) * 1000;
  const jitter = Math.random() * 400;
  return base + jitter;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface CallGeminiParams {
  contents: unknown;
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: unknown;
  temperature?: number;
  maxOutputTokens?: number;
  preferredModel?: string;
}

/**
 * Shared resilient helper for ALL Gemini calls (Section 7 / Requirements 1, 2, 3).
 * - Routes every call identically through this helper.
 * - Retries up to 3 times on transient errors with exponential backoff (~1s, 2s, 4s) + random jitter.
 * - Skips retries on 400, 401, 403, and safety-block errors.
 * - Follows model fallback chain (MODEL_SCAN -> MODEL_SMART -> FALLBACK_MODEL).
 * - Never leaks raw API errors.
 */
export async function callGemini(params: CallGeminiParams): Promise<string> {
  const {
    contents,
    systemInstruction,
    responseMimeType,
    responseSchema,
    temperature = 0.2,
    maxOutputTokens,
    preferredModel,
  } = params;

  // Build fallback chain: preferred first, then remaining models
  const candidateChain = [
    preferredModel || MODEL_SCAN,
    MODEL_SMART,
    FALLBACK_MODEL,
  ];
  const modelChain = Array.from(new Set(candidateChain));

  let lastError: unknown = null;
  let sawQuota = false;

  for (const model of modelChain) {
    const maxRetries = 3; // Up to 3 retries (4 total attempts) per model

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const config: Record<string, unknown> = {
          temperature,
        };
        if (systemInstruction) config.systemInstruction = systemInstruction;
        if (responseMimeType) config.responseMimeType = responseMimeType;
        if (responseSchema) config.responseSchema = responseSchema;
        if (maxOutputTokens) config.maxOutputTokens = maxOutputTokens;

        const response = await ai.models.generateContent({
          model,
          contents: contents as any,
          config,
        });

        const text = response.text?.trim() || '';
        if (text) {
          return text;
        }
        throw new Error('Empty response from model');
      } catch (err: unknown) {
        lastError = err;
        const errStr = String(err).toLowerCase();

        if (
          errStr.includes('429') ||
          errStr.includes('quota') ||
          errStr.includes('resource_exhausted')
        ) {
          sawQuota = true;
        }

        // If 404 / model not available to new users, advance to next model in chain immediately
        if (
          errStr.includes('404') ||
          errStr.includes('not_found') ||
          errStr.includes('no longer available')
        ) {
          console.warn(`[Gemini Fallback] Model ${model} not available. Proceeding to next model in chain.`);
          break;
        }

        // Check if transient
        if (!isTransientError(err)) {
          // Non-transient error (400, 401, 403, safety block): do not retry or fall back, fail immediately!
          console.error(`[Gemini Non-Transient Error] Model ${model}:`, err);
          throw new GeminiAppError(
            err instanceof Error ? err.message : 'Invalid request or safety block',
            false,
            false,
            400
          );
        }

        // Transient error: retry if attempts remain
        if (attempt < maxRetries) {
          const delay = getBackoffDelayMs(attempt);
          console.warn(
            `[Gemini Retry] Model ${model} transient failure (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${Math.round(delay)}ms...`
          );
          await sleep(delay);
        } else {
          console.warn(
            `[Gemini Chain] Model ${model} exhausted all ${maxRetries} retries. Moving to next model in chain...`
          );
        }
      }
    }
  }

  // All models in the fallback chain failed
  console.error('[Gemini All Models Exhausted] Technical details:', lastError);

  if (sawQuota) {
    throw new GeminiAppError(
      'The free AI limit is reached for now. You can still search by name or pick a category.',
      true,
      true,
      429
    );
  }

  throw new GeminiAppError(
    'The AI is busy right now. Please try again in a moment.',
    false,
    true,
    503
  );
}

/**
 * Server-side function to analyze an image using Gemini via callGemini().
 */
export async function scanWasteImageServer(params: {
  imageBase64: string;
  mimeType?: string;
  lang?: 'en' | 'hi';
  modelId?: string;
  userLessons?: string;
}): Promise<ScanResponse> {
  const { imageBase64, mimeType = 'image/jpeg', lang = 'en', modelId, userLessons = '' } = params;

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType,
    },
  };

  const textPrompt = {
    text: `Identify the waste items shown in this image for IIT Roorkee campus waste sorting under India's Solid Waste Management Rules 2026. Language: ${lang}. Return JSON matching the schema.`,
  };

  const systemInstruction = buildSystemInstruction(lang, userLessons);

  const textOutput = await callGemini({
    contents: {
      parts: [imagePart, textPrompt],
    },
    systemInstruction,
    responseMimeType: 'application/json',
    responseSchema: SCAN_RESPONSE_SCHEMA,
    temperature: 0.2,
    preferredModel: modelId || MODEL_SCAN,
  });

  const parsed = JSON.parse(textOutput) as ScanResponse;
  return postProcessScanResponse(parsed, lang);
}

/**
 * Server-side function to analyze a text query using Gemini via callGemini().
 */
export async function askWasteTextServer(params: {
  text: string;
  lang?: 'en' | 'hi';
  modelId?: string;
  userLessons?: string;
}): Promise<ScanResponse> {
  const { text, lang = 'en', modelId, userLessons = '' } = params;

  const systemInstruction = buildSystemInstruction(lang, userLessons);
  const userContent = `Identify waste classification and disposal for item: "${text}". Language: ${lang}. Output JSON matching the schema.`;

  const textOutput = await callGemini({
    contents: userContent,
    systemInstruction,
    responseMimeType: 'application/json',
    responseSchema: SCAN_RESPONSE_SCHEMA,
    temperature: 0.2,
    preferredModel: modelId || MODEL_SCAN,
  });

  const parsed = JSON.parse(textOutput) as ScanResponse;
  return postProcessScanResponse(parsed, lang);
}

/**
 * Waste Tutor chat (Section 5.9 / Requirements 1-5, 7):
 * Grounded in SWM_DIGEST and EXTENDED_DIGEST.
 * Answers in UI language in under 120 words.
 * Refuses off-topic questions politely.
 * Says "I'm not sure, check with the campus hygiene office or municipal body" when uncertain.
 */
export async function askWasteTutorServer(params: {
  message: string;
  history?: { role: 'user' | 'model'; text: string }[];
  lang?: 'en' | 'hi';
  modelId?: string;
}): Promise<string> {
  const { message, history = [], lang = 'en', modelId } = params;

  const langInstruction =
    lang === 'hi'
      ? 'Answer in simple, clear everyday Hindi (Devanagari script).'
      : 'Answer in concise, plain English.';

  const uncertainPhrase =
    lang === 'hi'
      ? 'मुझे पूरा यकीन नहीं है, कृपया परिसर स्वच्छता कार्यालय या नगर निगम से संपर्क करें।'
      : "I'm not sure, check with the campus hygiene office or municipal body.";

  const offTopicRefusal =
    lang === 'hi'
      ? 'मैं केवल परिसर कचरा प्रबंधन, पृथक्करण नियमों और रीसाइक्लिंग से जुड़े सवालों के उत्तर दे सकता हूँ।'
      : 'I am Bin Saathi, a waste segregation tutor. I only answer questions related to campus waste segregation, disposal rules, and recycling in India.';

  const tutorSystemInstruction = `You are "Bin Saathi", an expert waste segregation and disposal tutor for the IIT Roorkee campus community in India.

STRICT CONSTRAINTS:
1. Knowledge Grounding: Base answers ONLY on the Solid Waste Management Rules 2026, E-Waste Rules 2022, Battery Rules 2022, and Plastic Waste Management Rules.
2. Digest Knowledge Base:
SWM DIGEST:
${SWM_DIGEST}

EXTENDED DIGEST:
${EXTENDED_DIGEST}

3. Word Limit: Keep your answer UNDER 120 words. Be direct, practical, and helpful.
4. Language: ${langInstruction}
5. Uncertainty: If an item or route is not governed or clear from the statutory rules above, do not guess or speculate. Say exactly: "${uncertainPhrase}"
6. Off-Topic Requests: If the user asks about coding, math, general trivia, politics, history, or anything unrelated to waste management, politely decline: "${offTopicRefusal}"
7. Never invent rule numbers, helplines, or phone numbers. Cite only valid statutory categories (wet, dry, sanitary, e-waste, battery, special care).`;

  // Build contents including past conversation turns
  const contents = [
    ...history.slice(-6).map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    })),
    {
      role: 'user',
      parts: [{ text: message }],
    },
  ];

  const textOutput = await callGemini({
    contents,
    systemInstruction: tutorSystemInstruction,
    temperature: 0.2,
    maxOutputTokens: 250,
    preferredModel: modelId || MODEL_SMART,
  });

  return textOutput || uncertainPhrase;
}

