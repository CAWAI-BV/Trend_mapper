'use client';

import { useState } from 'react';

export default function HomePage() {
  const [text, setText] = useState('');

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          AI Trend Mapper
        </h1>
        <p className="text-base text-slate-300">
          Paste an article, report, or any research snippet to analyze emerging
          technology trends. This early preview keeps the Analyze button idle
          until the rest of the pipeline ships.
        </p>
      </header>

      <section className="flex flex-1 flex-col gap-4">
        <label className="text-sm font-medium text-slate-200" htmlFor="input-text">
          Paste text to analyze
        </label>
        <textarea
          id="input-text"
          className="h-64 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-base text-slate-100 shadow-sm placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
          placeholder="Start typing or paste a link to kick things off..."
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>{text.length.toLocaleString()} characters</span>
          <span>Limit 25,000 characters</span>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          disabled
        >
          Analyze
        </button>
      </section>

      <footer className="text-xs text-slate-500">
        Roadmap: ingestion → extraction → layout → visualization. Stay tuned!
      </footer>
    </main>
  );
}
