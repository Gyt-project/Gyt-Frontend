'use client';

import { useState } from 'react';
import { FileDiff as FileDiffType } from '@/types';
import { clsx } from 'clsx';
import { FileText, Plus, RefreshCw, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

interface FileDiffProps {
  files: FileDiffType[];
  patch?: string;
  showStats?: boolean;
}

interface DiffLine {
  type: 'meta' | 'hunk' | 'add' | 'remove' | 'context';
  content: string;
  oldNo: number | null;
  newNo: number | null;
}

function parsePatch(patch: string): Map<string, DiffLine[]> {
  const result = new Map<string, DiffLine[]>();
  const sections = patch.split(/(?=^diff --git )/m).filter((s) => s.trim());

  for (const section of sections) {
    const lines = section.split('\n');
    const plusLine = lines.find((l) => l.startsWith('+++ '));
    if (!plusLine) continue;
    const name =
      plusLine === '+++ /dev/null'
        ? (lines.find((l) => l.startsWith('--- '))?.replace('--- a/', '') ?? '')
        : plusLine.replace('+++ b/', '').replace('+++ ', '');
    if (!name || name === '/dev/null') continue;

    const parsedLines: DiffLine[] = [];
    let oldLine = 0,
      newLine = 0;

    for (const line of lines) {
      if (
        /^(diff --git|index |old mode|new mode|new file mode|deleted file mode|rename |similarity |Binary files)/.test(
          line
        )
      ) {
        parsedLines.push({ type: 'meta', content: line, oldNo: null, newNo: null });
      } else if (line.startsWith('--- ') || line.startsWith('+++ ')) {
        parsedLines.push({ type: 'meta', content: line, oldNo: null, newNo: null });
      } else if (line.startsWith('@@')) {
        const m = line.match(/@@ -([0-9]+)(?:,[0-9]+)? \+([0-9]+)(?:,[0-9]+)? @@/);
        if (m) {
          oldLine = parseInt(m[1]);
          newLine = parseInt(m[2]);
        }
        parsedLines.push({ type: 'hunk', content: line, oldNo: null, newNo: null });
      } else if (line.startsWith('+')) {
        parsedLines.push({ type: 'add', content: line.slice(1), oldNo: null, newNo: newLine++ });
      } else if (line.startsWith('-')) {
        parsedLines.push({ type: 'remove', content: line.slice(1), oldNo: oldLine++, newNo: null });
      } else if (line.startsWith(' ')) {
        parsedLines.push({
          type: 'context',
          content: line.slice(1),
          oldNo: oldLine++,
          newNo: newLine++,
        });
      } else if (line === '\\ No newline at end of file') {
        parsedLines.push({ type: 'meta', content: line, oldNo: null, newNo: null });
      }
    }
    result.set(name, parsedLines);
  }
  return result;
}

const statusIcon: Record<string, React.ReactNode> = {
  added: <Plus size={12} className="text-success-fg" />,
  removed: <Trash2 size={12} className="text-danger-fg" />,
  modified: <RefreshCw size={12} className="text-warning-fg" />,
  renamed: <RefreshCw size={12} className="text-accent-fg" />,
};

export default function FileDiffList({ files, patch, showStats = true }: FileDiffProps) {
  const parsedMap = patch ? parsePatch(patch) : null;
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(files.map((f) => f.path)));

  const toggle = (path: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });

  return (
    <div className="space-y-2">
      {showStats && (
        <div className="flex gap-4 text-xs text-fg-muted mb-3">
          <span>{files.length} files changed</span>
          <span className="text-success-fg">+{files.reduce((s, f) => s + f.additions, 0)} additions</span>
          <span className="text-danger-fg">-{files.reduce((s, f) => s + f.deletions, 0)} deletions</span>
        </div>
      )}

      {files.map((file) => {
        const diffLines = parsedMap?.get(file.path);
        const isExp = expanded.has(file.path);
        const canExpand = !!diffLines;

        return (
          <div key={file.path} className="border border-border rounded-md overflow-hidden">
            {/* File header */}
            <div
              className={clsx(
                'flex items-center gap-2 px-3 py-2 bg-canvas-subtle',
                canExpand && 'cursor-pointer hover:bg-canvas-overlay transition-colors'
              )}
              onClick={() => canExpand && toggle(file.path)}
            >
              {canExpand ? (
                isExp ? (
                  <ChevronDown size={14} className="text-fg-muted flex-shrink-0" />
                ) : (
                  <ChevronRight size={14} className="text-fg-muted flex-shrink-0" />
                )
              ) : null}
              <FileText size={14} className="text-fg-muted flex-shrink-0" />
              {statusIcon[file.status.toLowerCase()] ?? statusIcon.modified}
              <span className="flex-1 text-sm font-mono text-fg truncate">
                {file.oldPath && file.oldPath !== file.path
                  ? `${file.oldPath} → ${file.path}`
                  : file.path}
              </span>
              <div className="flex items-center gap-1 text-xs flex-shrink-0">
                <span className="text-success-fg">+{file.additions}</span>
                <span className="text-danger-fg">-{file.deletions}</span>
              </div>
              {/* Visual bar */}
              <div className="hidden sm:flex gap-0.5 flex-shrink-0">
                {Array.from({ length: 5 }).map((_, i) => {
                  const total = file.additions + file.deletions;
                  const addRatio = total > 0 ? file.additions / total : 0;
                  return (
                    <div
                      key={i}
                      className={clsx(
                        'w-2 h-3 rounded-sm',
                        i / 5 < addRatio ? 'bg-success' : 'bg-danger'
                      )}
                    />
                  );
                })}
              </div>
            </div>

            {/* Diff lines */}
            {canExpand && isExp && diffLines && (
              <div className="overflow-x-auto border-t border-border">
                <table className="w-full border-collapse text-xs font-mono">
                  <tbody>
                    {diffLines
                      .filter((l) => l.type !== 'meta')
                      .map((line, i) => {
                        if (line.type === 'hunk') {
                          return (
                            <tr key={i} className="bg-accent-muted">
                              <td className="px-2 py-0.5 w-12 text-right select-none text-fg-muted border-r border-border/40" />
                              <td className="px-2 py-0.5 w-12 text-right select-none text-fg-muted border-r border-border/40" />
                              <td className="px-3 py-0.5 text-accent-fg whitespace-pre">{line.content}</td>
                            </tr>
                          );
                        }
                        const bgClass =
                          line.type === 'add'
                            ? 'bg-success-muted'
                            : line.type === 'remove'
                            ? 'bg-danger-muted'
                            : '';
                        const textClass =
                          line.type === 'add'
                            ? 'text-success-fg'
                            : line.type === 'remove'
                            ? 'text-danger-fg'
                            : 'text-fg';
                        const prefix =
                          line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';
                        return (
                          <tr key={i} className={bgClass}>
                            <td
                              className={clsx(
                                'px-2 py-0.5 w-12 text-right select-none text-fg-muted border-r border-border/40',
                                bgClass
                              )}
                            >
                              {line.oldNo ?? ''}
                            </td>
                            <td
                              className={clsx(
                                'px-2 py-0.5 w-12 text-right select-none text-fg-muted border-r border-border/40',
                                bgClass
                              )}
                            >
                              {line.newNo ?? ''}
                            </td>
                            <td className={clsx('px-3 py-0.5 whitespace-pre', textClass)}>
                              <span className="mr-2 select-none opacity-60">{prefix}</span>
                              {line.content}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
