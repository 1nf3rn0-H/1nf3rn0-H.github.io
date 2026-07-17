# hm://research

A static Detection Engineering Research Terminal for Harsh Mehta. It is built with Astro, MDX content collections, RSS, sitemap generation, and Pagefind static search indexing.

## Commands

```bash
npm install
npm run dev
npm run check
npm run build
npm run new:log
```

Research entries live in `src/content/logs/`. Their frontmatter is type-checked by `src/content.config.ts`; drafts remain out of production builds. GitHub Actions deploys a push to `main` to GitHub Pages.

For a custom domain, set `SITE_URL` to the domain URL and leave `BASE_URL` empty in the deployment environment.
