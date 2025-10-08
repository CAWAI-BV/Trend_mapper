# AI Trend Mapper

Bootstrapped Next.js application for exploring AI-driven trend analysis.

The MVP includes:

- **Text ingestion** for pasted text, article URLs (via Readability), and PDF payloads.
- **Trend extraction** powered by OpenAI Responses API with automatic JSON repair and schema validation.
- **Layout generation** that embeds phrases, projects them to 2D with PCA, and scales bubble sizes by weight.

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

## API Endpoints

### POST `/api/ingest`

```json
{
  "sourceType": "text" | "url" | "pdf",
  "payload": "..." // raw text, absolute URL, or base64/data URL/URL to a PDF
}
```

Returns `{ "text": string, "meta": { "title?": string, "source?": string } }` with whitespace normalized and truncated to 25,000 characters.

### POST `/api/extract`

```json
{
  "text": "...", // up to ~25k characters
  "topK": 12
}
```

Returns `{ "trends": [ { "phrase", "weight", "sentiment", "examples" } ] }`. The handler validates JSON from OpenAI and retries with a repair prompt when needed.

### POST `/api/layout`

```json
{
  "trends": [ { "phrase", "weight", "sentiment", "examples" } ]
}
```

Embeds each phrase, runs PCA to generate `x`/`y` coordinates, and scales `r` using weights.

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
