import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const logs = defineCollection({
  loader: glob({ base: './src/content/logs', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string().min(10).max(120), description: z.string().min(20).max(220), publishedAt: z.coerce.date(), updatedAt: z.coerce.date().optional(),
    status: z.enum(['draft', 'published']), type: z.enum(['article', 'research-note', 'experiment', 'architecture', 'field-note']),
    category: z.enum(['detection-engineering', 'threat-intelligence', 'security-automation', 'telemetry', 'platform-reliability', 'deception-engineering', 'ai-security', 'research']),
    tags: z.array(z.string().min(1)).min(1), difficulty: z.enum(['introductory', 'intermediate', 'advanced']).optional(), featured: z.boolean().default(false),
    tools: z.array(z.string()).optional(), mitre: z.array(z.string()).optional(), signals: z.array(z.string()).optional(), platforms: z.array(z.string()).optional(), repository: z.string().url().optional(), canonicalUrl: z.string().url().optional(),
  }),
});
export const collections = { logs };
