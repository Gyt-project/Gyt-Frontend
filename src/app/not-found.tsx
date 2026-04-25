'use client';

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4 text-center">
      {/* Giant 404 */}
      <div className="relative select-none mb-6">
        <span className="text-[10rem] font-black leading-none text-border">404</span>
        <span className="absolute inset-0 flex items-center justify-center text-[10rem] font-black leading-none text-accent opacity-10 blur-xl pointer-events-none">404</span>
      </div>

      <h1 className="text-2xl font-bold text-fg mb-1">Oops &mdash; this page doesn&apos;t exist</h1>
      <p className="text-fg-muted text-sm mb-8">
        The resource you&apos;re looking for was deleted, moved, or never existed.
      </p>

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
        HTTP 404 &middot; Not Found
      </p>
    </div>
  );
}

