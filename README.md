# Telemetry Lab

A static detection-engineering research journal for Harsh Mehta. It is built with Astro, typed Markdown content collections, structured JSON Field Notes, RSS, sitemap generation, and a client-side archive search.

## Commands

```bash
npm install
npm run dev
npm run check
npm run build
npm run new:log
```

Research entries live in `src/content/logs/`. Their frontmatter is type-checked by `src/content.config.ts`; drafts remain out of production builds. Daily Field Notes live in `src/data/field-notes/`, while `src/data/current-edition.json` drives the latest-edition route and homepage preview.

Store research-log images under `public/logs/<post-slug>/` and reference them with standard Markdown image syntax.

The Field Notes archive search is generated at build time and filtered entirely in the browser. It does not require an external search service.

## Field Notes synchronization

The synchronization commands default to a sibling Field Notes workspace at `../web`:

```bash
npm run sync:field-notes
npm run sync:field-notes-style
```

Override those source paths when the workspace lives elsewhere:

```bash
FIELD_NOTES_SOURCE_DIR=/path/to/editions npm run sync:field-notes
FIELD_NOTES_STYLE_SOURCE=/path/to/globals.css npm run sync:field-notes-style
```

GitHub Actions checks dependencies, type-checks the project, builds the static site, and deploys pushes to `main` to GitHub Pages.

For a custom domain, set `SITE_URL` to the domain URL and leave `BASE_URL` empty in the deployment environment.
