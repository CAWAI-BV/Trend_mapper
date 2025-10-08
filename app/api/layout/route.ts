import OpenAI from 'openai';
import PCA from 'ml-pca';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { LayoutRequestSchema, Trend } from '@/lib/schemas';

export const runtime = 'nodejs';
export const maxDuration = 60;

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small';

function ensureClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  return new OpenAI({ apiKey });
}

function computeRadius(weight: number, minWeight: number, maxWeight: number) {
  const minRadius = 24;
  const maxRadius = 56;

  if (Number.isNaN(weight)) {
    return (minRadius + maxRadius) / 2;
  }

  if (maxWeight === minWeight) {
    return (minRadius + maxRadius) / 2;
  }

  const normalized = (weight - minWeight) / (maxWeight - minWeight);
  return minRadius + normalized * (maxRadius - minRadius);
}

function normalizeCoordinates(points: Array<[number, number]>) {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return points.map(([x, y]) => {
    const safeX = maxX === minX ? 0 : ((x - minX) / (maxX - minX)) * 2 - 1;
    const safeY = maxY === minY ? 0 : ((y - minY) / (maxY - minY)) * 2 - 1;
    return [Number.isFinite(safeX) ? safeX : 0, Number.isFinite(safeY) ? safeY : 0] as const;
  });
}

function buildNodes(trends: Trend[], coordinates: Array<[number, number]>) {
  const weights = trends.map((trend) => trend.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);

  return trends.map((trend, index) => {
    const [x, y] = coordinates[index] ?? [0, 0];

    return {
      id: trend.phrase,
      x,
      y,
      r: computeRadius(trend.weight, minWeight, maxWeight),
      weight: trend.weight,
      sentiment: trend.sentiment
    };
  });
}

async function embed(trends: Trend[]) {
  const client = ensureClient();
  const phrases = trends.map((trend) => trend.phrase);

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: phrases
  });

  return response.data.map((item) => item.embedding);
}

function projectTo2D(vectors: number[][]) {
  if (vectors.length === 1) {
    return [[0, 0]];
  }

  const pca = new PCA(vectors, { center: true, scale: true });
  const projected = pca.predict(vectors, { nComponents: 2 }).to2DArray();

  return projected.map((point) => [point[0] ?? 0, point[1] ?? 0]);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trends } = LayoutRequestSchema.parse(body);

    const embeddings = await embed(trends);
    const coordinates = normalizeCoordinates(projectTo2D(embeddings));
    const nodes = buildNodes(trends, coordinates);

    return NextResponse.json({ nodes });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : 'Unexpected error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
