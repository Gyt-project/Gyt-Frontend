'use client';

import Link from 'next/link';
import { useState } from 'react';
import { RefreshCw, Home, ArrowLeft } from 'lucide-react';

const JOKES = [
  { setup: "Why do Java developers wear glasses?", punchline: "Because they don't C#." },
  { setup: "A SQL query walks into a bar, walks up to two tables and asks...", punchline: '"Can I join you?"' },
  { setup: "How many programmers does it take to change a light bulb?", punchline: "None. That's a hardware problem." },
  { setup: "Why do programmers prefer dark mode?", punchline: "Because light attracts bugs." },
  { setup: "What's a programmer's favorite type of music?", punchline: "Algo-rhythm." },
  { setup: "Why was the JavaScript developer sad?", punchline: "Because he didn't Node how to Express himself." },
  { setup: "What do you call a programmer from Finland?", punchline: "Nerdic." },
  { setup: "What did the developer say when they found the bug?", punchline: '"It works on my machine."' },
  { setup: "Why did the programmer quit their job?", punchline: "Because they didn't get arrays." },
  { setup: "What's a ghost's favorite programming language?", punchline: "BOOlean." },
  { setup: "Why don't programmers like nature?", punchline: "Too many bugs and no documentation." },
  { setup: "What did the HTTP 404 say to the client?", punchline: '"Sorry, I lost what you were looking for."' },
  { setup: "How does a developer declare bankruptcy?", punchline: "They file for Chapter 11." },
  { setup: "Why did the developer go broke?", punchline: "Because he used up all his cache." },
  { setup: "What's the object-oriented way to become wealthy?", punchline: "Inheritance." },
];

export default function NotFound() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * JOKES.length));
  const [revealed, setRevealed] = useState(false);
  const [flipping, setFlipping] = useState(false);

  const nextJoke = () => {
    setFlipping(true);
    setTimeout(() => {
      setIdx((i) => (i + 1) % JOKES.length);
      setRevealed(false);
      setFlipping(false);
    }, 200);
  };

  const joke = JOKES[idx];

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4 text-center">
      {/* Giant 404 */}
      <div className="relative select-none mb-6">
        <span className="text-[10rem] font-black leading-none text-border">404</span>
        <span className="absolute inset-0 flex items-center justify-center text-[10rem] font-black leading-none text-accent opacity-10 blur-xl pointer-events-none">404</span>
      </div>

      <h1 className="text-2xl font-bold text-fg mb-1">Oops — this page doesn&apos;t exist</h1>
      <p className="text-fg-muted text-sm mb-8">
        The resource you&apos;re looking for was deleted, moved, or never existed.
        <br />
        While you&apos;re here, enjoy a developer joke.
      </p>

      {/* Joke card */}
      <div
        className={`w-full max-w-md border border-border rounded-xl bg-canvas-subtle p-6 mb-6 transition-all duration-200 ${
          flipping ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <p className="text-fg font-medium text-base mb-4 leading-snug">{joke.setup}</p>

        {revealed ? (
          <p className="text-accent-fg font-semibold text-sm animate-fade-in">{joke.punchline}</p>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            className="text-xs text-fg-muted border border-border rounded-full px-4 py-1.5 hover:text-fg hover:border-fg-muted transition-colors"
          >
            Reveal punchline
          </button>
        )}
      </div>

      {/* Next joke */}
      <button
        onClick={nextJoke}
        className="flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg transition-colors mb-8"
      >
        <RefreshCw size={12} />
        Another one
      </button>

      {/* Nav */}
      <div className="flex items-center gap-3">
        <Link
          href="javascript:history.back()"
          onClick={(e) => { e.preventDefault(); history.back(); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md border border-border text-sm text-fg-muted hover:text-fg hover:border-fg-muted transition-colors"
        >
          <ArrowLeft size={14} />
          Go back
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-white text-sm hover:bg-accent/90 transition-colors"
        >
          <Home size={14} />
          Home
        </Link>
      </div>

      {/* HTTP status badge */}
      <p className="mt-10 text-xs text-fg-muted font-mono opacity-40">
        HTTP 404 · Not Found
      </p>
    </div>
  );
}
