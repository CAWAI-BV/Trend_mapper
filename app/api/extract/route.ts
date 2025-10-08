import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { TrendsResponseSchema } from '@/lib/schemas';
import { enforceCharacterLimit, normalizeText } from '@/lib/text';

export const runtime = 'nodejs';
export const maxDuration = 60;

const CHARACTER_LIMIT = 25_000;
const DEFAULT_MODEL = process.env.OPENAI_EXTRACTION_MODEL ?? 'gpt-4o';
const FALLBACK_MODEL = process.env.OPENAI_JSON_REPAIR_MODEL ?? 'gpt-4o-mini';

const ExtractRequestSchema = z.object({
  text: z.string().min(1),
  topK: z.number().int().min(1).max(15).optional()
});

function ensureClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  return new OpenAI({ apiKey });
}

async function callExtractor({ text, topK }: { text: string; topK?: number }) {
  const client = ensureClient();
  const limitInstruction = topK ? `Limit to ${topK} trends.` : 'Limit to 10–15 trends.';
  const prompt = `Extract technology or trend phrases from the article. For each, output:\n- phrase (short, specific, e.g., "edge computing")\n- weight (0..1) capturing importance in THIS article\n- sentiment: positive | neutral | negative (author’s stance)\n- examples: 2 short quotes (verbatim) from the article\n${limitInstruction}\nNo duplicates. JSON only in this exact shape:\n{ "trends": [ { "phrase": "...", "weight": 0.73, "sentiment": "neutral", "examples": ["...","..."] } ] }\n\nArticle:\n<<<${text}>>>`;

  const response = await client.responses.create({
    model: DEFAULT_MODEL,
    input: [
      { role: 'system', content: 'You return compact, correct JSON only.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0
  });

  return response.output_text ?? '';
}

async function repairJson(badJson: string, topK?: number) {
  const client = ensureClient();
  const limitInstruction = topK ? `The array must contain at most ${topK} items.` : 'The array must contain at most 15 items.';

  const response = await client.responses.create({
    model: FALLBACK_MODEL,
    input: [
      {
        role: 'system',
        content:
          'You repair JSON to match the schema { "trends": [ { "phrase": string, "weight": number (0..1), "sentiment": "positive"|"neutral"|"negative", "examples": string[2] } ] } and return JSON only.'
      },
      {
        role: 'user',
        content: `Fix this into valid JSON. ${limitInstruction}\n\n${badJson}`
      }
    ],
    temperature: 0
  });

  return response.output_text ?? '';
}

function parseAndValidate(raw: string) {
  const parsed = JSON.parse(raw);
  const validated = TrendsResponseSchema.parse(parsed);
  return validated;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, topK } = ExtractRequestSchema.parse(body);

    const normalized = enforceCharacterLimit(normalizeText(text), CHARACTER_LIMIT);

    const raw = await callExtractor({ text: normalized, topK });

    try {
      const validated = parseAndValidate(raw);
      return NextResponse.json(validated);
    } catch (parseError) {
      const repairedRaw = await repairJson(raw, topK);
      const validated = parseAndValidate(repairedRaw);
      return NextResponse.json(validated);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : 'Unexpected error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
