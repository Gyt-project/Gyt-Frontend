'use client';

import { useState } from 'react';
import { ClipboardCopy, Check, ChevronDown } from 'lucide-react';
import { CloneURLs } from '@/types';

interface CloneButtonProps {
  cloneUrls: CloneURLs;
}

type Protocol = 'https' | 'ssh' | 'git';

export default function CloneButton({ cloneUrls }: CloneButtonProps) {
  const [open, setOpen] = useState(false);
  const [protocol, setProtocol] = useState<Protocol>('https');
  const [copied, setCopied] = useState(false);

  const url = { https: cloneUrls.httpUrl, ssh: cloneUrls.sshUrl, git: cloneUrls.gitUrl }[protocol];

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-emphasis text-white text-sm font-medium rounded-md transition-colors"
      >
        <span>Clone</span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-80 bg-canvas-overlay border border-border rounded-md shadow-xl p-3">
            <p className="text-xs font-semibold text-fg mb-2">Clone</p>

            {/* Protocol tabs */}
            <div className="flex gap-1 mb-3 border-b border-border">
              {(['https', 'ssh', 'git'] as Protocol[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setProtocol(p)}
                  className={`px-2 pb-1.5 text-xs font-medium border-b-2 transition-colors uppercase ${
                    protocol === p
                      ? 'border-accent-fg text-fg'
                      : 'border-transparent text-fg-muted hover:text-fg'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                readOnly
                value={url}
                className="flex-1 text-xs bg-canvas border border-border rounded px-2 py-1.5 text-fg font-mono focus:outline-none"
              />
              <button
                onClick={copy}
                className="p-1.5 hover:bg-canvas-subtle rounded border border-border text-fg-muted hover:text-fg transition-colors"
              >
                {copied ? <Check size={14} className="text-success-fg" /> : <ClipboardCopy size={14} />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
