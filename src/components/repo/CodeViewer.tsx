'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { formatBytes, getLanguageFromPath } from '@/lib/utils';

interface CodeViewerProps {
  content: string;
  path: string;
  size: number;
  isBinary: boolean;
}

export default function CodeViewer({ content, path, size, isBinary }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const lang = getLanguageFromPath(path);
  const lines = content.split('\n');

  const copy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isBinary) {
    return (
      <div className="border border-border rounded-md p-8 text-center text-fg-muted text-sm">
        Binary file — {formatBytes(size)}
      </div>
    );
  }

  return (
    <div className="border border-border rounded-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-canvas-subtle border-b border-border">
        <span className="text-xs text-fg-muted">
          {lines.length} lines · {formatBytes(size)} · {lang}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-xs text-fg-muted hover:text-fg transition-colors px-2 py-1 rounded hover:bg-canvas-overlay"
        >
          {copied ? <Check size={12} className="text-success-fg" /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Code */}
      <div className="overflow-auto bg-canvas">
        <table className="w-full text-xs font-mono">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="hover:bg-accent-subtle/30 transition-colors group">
                <td className="select-none text-right text-fg-subtle pr-4 pl-3 py-0.5 border-r border-border w-12 sticky left-0 bg-canvas">
                  {i + 1}
                </td>
                <td className="pl-4 pr-4 py-0.5 whitespace-pre text-fg">
                  {line || ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
