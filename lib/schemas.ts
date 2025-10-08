import { z } from 'zod';

export const TrendSchema = z.object({
  phrase: z.string().min(1),
  weight: z.number().min(0).max(1),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  examples: z.array(z.string().min(1)).min(1)
});

export const TrendsResponseSchema = z.object({
  trends: z.array(TrendSchema).min(1).max(15)
});

export const LayoutRequestSchema = z.object({
  trends: z.array(TrendSchema).min(1)
});

export type Trend = z.infer<typeof TrendSchema>;
