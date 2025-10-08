import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import pdfParse from 'pdf-parse';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { enforceCharacterLimit, normalizeText } from '@/lib/text';

export const runtime = 'nodejs';

const CHARACTER_LIMIT = 25_000;

const IngestRequestSchema = z.object({
  sourceType: z.enum(['text', 'url', 'pdf']),
  payload: z.string().min(1)
});

async function readUrl(payload: string) {
  const url = new URL(payload);
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL (status ${response.status})`);
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url: url.toString() });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  const textContent = article?.textContent ?? dom.window.document.body?.textContent ?? '';

  return {
    text: textContent,
    meta: {
      title: article?.title ?? dom.window.document.title ?? undefined,
      source: url.toString()
    }
  } as const;
}

async function readPdf(payload: string) {
  if (/^https?:\/\//i.test(payload)) {
    const response = await fetch(payload);

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF (status ${response.status})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const data = await pdfParse(Buffer.from(arrayBuffer));

    return {
      text: data.text,
      meta: {
        title: data.info?.Title || undefined,
        source: payload
      }
    } as const;
  }

  const base64 = payload.includes(',') ? payload.split(',').pop() ?? '' : payload;

  if (!base64.trim()) {
    throw new Error('PDF payload is empty');
  }

  const buffer = Buffer.from(base64, 'base64');
  const data = await pdfParse(buffer);

  return {
    text: data.text,
    meta: {
      title: data.info?.Title || undefined,
      source: 'uploaded-pdf'
    }
  } as const;
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { sourceType, payload } = IngestRequestSchema.parse(json);

    let text = '';
    let meta: Record<string, string | undefined> = {};

    if (sourceType === 'text') {
      text = payload;
    } else if (sourceType === 'url') {
      const result = await readUrl(payload);
      text = result.text;
      meta = result.meta;
    } else {
      const result = await readPdf(payload);
      text = result.text;
      meta = result.meta;
    }

    const normalized = enforceCharacterLimit(normalizeText(text), CHARACTER_LIMIT);

    if (!normalized) {
      return NextResponse.json({ error: 'Unable to extract readable text from the source.' }, { status: 422 });
    }

    const cleanedMeta = Object.fromEntries(
      Object.entries(meta).filter(([, value]) => typeof value === 'string' && value.length > 0)
    );

    return NextResponse.json({ text: normalized, meta: cleanedMeta });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : 'Unexpected error';

    return NextResponse.json({ error: message }, { status: 422 });
  }
}
