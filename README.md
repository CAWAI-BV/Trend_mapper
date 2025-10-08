# AI Trend Mapper

Bootstrapped Next.js application for exploring AI-driven trend analysis.

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Copy the environment file and add your keys

   ```bash
   cp .env.example .env.local
   ```

3. Run the development server

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the app. You should see a textarea input and a disabled **Analyze** button that will be wired up in later phases.

## Scripts

- `npm run dev` – start the Next.js development server.
- `npm run lint` – run ESLint using the Next.js configuration.
- `npm run type-check` – verify TypeScript types without emitting files.
- `npm run build` – create an optimized production build.
- `npm run format` – format files using Prettier.
- `npm run format:check` – check formatting without making changes.

## Tooling

- **Next.js App Router** with TypeScript and Tailwind CSS.
- **API routes** scaffolded under `app/api/*` for ingestion, extraction, and layout.
- **ESLint** and **Prettier** enforced via a Husky pre-commit hook.
- **GitHub Actions CI** runs linting, type-checking, and builds on pushes and pull requests.

## Folder Structure

```
app/
  api/
    extract/
    ingest/
    layout/
  globals.css
  layout.tsx
  page.tsx
```

This baseline will expand to include ingestion, extraction, layout, visualization, and persistence capabilities in subsequent phases.
