import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig } from '../config/site';
export async function GET(context: { site: URL }) { const logs = (await getCollection('logs', ({ data }) => data.status === 'published')).sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf()); return rss({ title: `${siteConfig.name} — Research Logs`, description: siteConfig.description, site: context.site, items: logs.map((log) => ({ title: log.data.title, description: log.data.description, pubDate: log.data.publishedAt, link: `/logs/${log.id}/`, categories: log.data.tags })), customData: '<language>en-us</language>' }); }
