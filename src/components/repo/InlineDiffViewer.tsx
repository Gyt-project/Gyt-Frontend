'use client';

import React, { useState, useEffect } from 'react';
import { FileDiff as FileDiffType, PRComment, User } from '@/types';
import { clsx } from 'clsx';
import { FileText, Plus, RefreshCw, Trash2, ChevronDown, ChevronRight, Pencil, MessageSquare, Clock } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { formatRelativeTime } from '@/lib/utils';

export interface InlineDiffViewerProps {
  files: FileDiffType[];
  patch?: string;
  inlineComments?: PRComment[];
  currentUser?: User | null;
  headCommitSha?: string | null;
  onAddComment?: (path: string, line: number | null, body: string, commitSha: string | null) => Promise<void>;
  onUpdateComment?: (id: string, body: string) => void;
  onDeleteComment?: (id: string) => void;
  showStats?: boolean;
}

export interface DiffLine {
  type: 'meta' | 'hunk' | 'add' | 'remove' | 'context';
  content: string;
  oldNo: number | null;
  newNo: number | null;
}

export function normalizeDiffPath(path?: string | null): string {
  if (!path) return '';
  return path
    .replace(/\\/g, '/')
    .replace(/^(?:a|b)\//, '')
    .replace(/^\/+/, '')
    .trim();
}

function diffPathsMatch(left?: string | null, right?: string | null): boolean {
  const a = normalizeDiffPath(left);
  const b = normalizeDiffPath(right);
  if (!a || !b) return false;
  if (a === b) return true;
  return a.endsWith(`/${b}`) || b.endsWith(`/${a}`);
}

function asLineNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function parsePatch(patch: string): Map<string, DiffLine[]> {
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
    let oldLine = 0, newLine = 0;
    for (const line of lines) {
      if (/^(diff --git|index |old mode|new mode|new file mode|deleted file mode|rename |similarity |Binary files)/.test(line)) {
        parsedLines.push({ type: 'meta', content: line, oldNo: null, newNo: null });
      } else if (line.startsWith('--- ') || line.startsWith('+++ ')) {
        parsedLines.push({ type: 'meta', content: line, oldNo: null, newNo: null });
      } else if (line.startsWith('@@')) {
        const m = line.match(/@@ -([0-9]+)(?:,[0-9]+)? \+([0-9]+)(?:,[0-9]+)? @@/);
        if (m) { oldLine = parseInt(m[1]); newLine = parseInt(m[2]); }
        parsedLines.push({ type: 'hunk', content: line, oldNo: null, newNo: null });
      } else if (line.startsWith('+')) {
        parsedLines.push({ type: 'add', content: line.slice(1), oldNo: null, newNo: newLine++ });
      } else if (line.startsWith('-')) {
        parsedLines.push({ type: 'remove', content: line.slice(1), oldNo: oldLine++, newNo: null });
      } else if (line.startsWith(' ')) {
        parsedLines.push({ type: 'context', content: line.slice(1), oldNo: oldLine++, newNo: newLine++ });
      } else if (line === '\\ No newline at end of file') {
        parsedLines.push({ type: 'meta', content: line, oldNo: null, newNo: null });
      }
    }
    result.set(name, parsedLines);
    result.set(normalizeDiffPath(name), parsedLines);
  }
  return result;
}

const statusIcon: Record<string, React.ReactNode> = {
  added: <Plus size={12} className="text-success-fg" />,
  removed: <Trash2 size={12} className="text-danger-fg" />,
  modified: <RefreshCw size={12} className="text-warning-fg" />,
  renamed: <RefreshCw size={12} className="text-accent-fg" />,
};

// ─── Inline comment form ──────────────────────────────────────────────────────

function InlineCommentForm({
  currentUser, onSubmit, onCancel,
}: {
  currentUser?: User | null;
  onSubmit: (body: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!body.trim()) return;
    setLoading(true);
    try { await onSubmit(body); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-3 bg-canvas border-t-2 border-accent">
      <div className="flex gap-3 items-start">
        <Avatar src={currentUser?.avatarUrl} name={currentUser?.username ?? 'A'} size={28} />
        <div className="flex-1 border border-border rounded-md overflow-hidden bg-canvas-subtle">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Leave a comment..."
            rows={3}
            className="rounded-none border-0 border-b border-border bg-canvas focus:ring-0 text-sm resize-none"
            autoFocus
          />
          <div className="flex items-center justify-between px-3 py-2 bg-canvas-subtle">
            <p className="text-xs text-fg-muted">Markdown supported</p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
              <Button size="sm" variant="primary" loading={loading} disabled={!body.trim()} onClick={handleSubmit}>
                Add single comment
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inline comment display ───────────────────────────────────────────────────

function InlineCommentBlock({
  comment, currentUser, onUpdate, onDelete, isOutdated,
}: {
  comment: PRComment;
  currentUser?: User | null;
  onUpdate?: (id: string, body: string) => void;
  onDelete?: (id: string) => void;
  isOutdated?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body);
  const [saving, setSaving] = useState(false);
  const isAuthor = currentUser?.username === comment.author.username;

  return (
    <div className={clsx('mx-2 my-1.5 rounded-md border bg-canvas shadow-sm overflow-hidden', isOutdated ? 'border-border/50 opacity-75' : 'border-border')}>
      <div className="flex gap-2.5 items-start p-3">
        <Avatar src={comment.author.avatarUrl} name={comment.author.username} size={22} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-semibold text-fg">{comment.author.username}</span>
            <span className="text-xs text-fg-muted">{formatRelativeTime(comment.createdAt)}</span>
            {isOutdated && (
              <span className="flex items-center gap-0.5 text-[10px] text-fg-muted bg-canvas-subtle border border-border/60 px-1.5 py-0.5 rounded-full">
                <Clock size={9} />
                Outdated
              </span>
            )}
            {isAuthor && (
              <div className="ml-auto flex gap-1">
                <button onClick={() => setEditing((e) => !e)} className="p-0.5 text-fg-muted hover:text-fg rounded"><Pencil size={11} /></button>
                {onDelete && <button onClick={() => onDelete(comment.id)} className="p-0.5 text-fg-muted hover:text-danger-fg rounded"><Trash2 size={11} /></button>}
              </div>
            )}
          </div>
          {editing ? (
            <div className="space-y-2">
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="text-xs" />
              <div className="flex gap-1.5">
                <Button size="xs" variant="primary" loading={saving} onClick={async () => { setSaving(true); try { onUpdate?.(comment.id, body); setEditing(false); } finally { setSaving(false); } }}>Save</Button>
                <Button size="xs" onClick={() => { setEditing(false); setBody(comment.body); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"><MarkdownRenderer>{comment.body}</MarkdownRenderer></div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function InlineDiffViewer({
  files,
  patch,
  inlineComments = [],
  currentUser,
  headCommitSha,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  showStats = true,
}: InlineDiffViewerProps) {
  const parsedMap = patch ? parsePatch(patch) : null;
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(files.map((f) => f.path)));
  const [commentFormLine, setCommentFormLine] = useState<{ path: string; line: number | null; rowKey: string } | null>(null);

  // Auto-expand files that have inline comments
  useEffect(() => {
    if (inlineComments.length > 0) {
      setExpanded((prev) => {
        const next = new Set(prev);
        inlineComments.forEach((c) => { if (c.path) next.add(c.path); });
        return next;
      });
    }
  }, [inlineComments]);

  const toggle = (path: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });

  const totalAdditions = files.reduce((s, f) => s + f.additions, 0);
  const totalDeletions = files.reduce((s, f) => s + f.deletions, 0);

  return (
    <div className="space-y-3">
      {showStats && (
        <div className="flex gap-4 text-xs text-fg-muted">
          <span className="font-medium text-fg">{files.length} file{files.length !== 1 ? 's' : ''} changed</span>
          <span className="text-success-fg font-medium">+{totalAdditions}</span>
          <span className="text-danger-fg font-medium">-{totalDeletions}</span>
        </div>
      )}

      {files.map((file) => {
        const normalizedFilePath = normalizeDiffPath(file.path);
        const normalizedOldPath = normalizeDiffPath(file.oldPath);
        const diffLines =
          parsedMap?.get(file.path) ??
          parsedMap?.get(normalizedFilePath) ??
          (file.oldPath ? parsedMap?.get(file.oldPath) : undefined) ??
          (normalizedOldPath ? parsedMap?.get(normalizedOldPath) : undefined);
        const isExp = expanded.has(file.path);
        const canExpand = !!diffLines;
        const fileInlineComments = inlineComments.filter(
          (c) =>
            (diffPathsMatch(c.path, file.path) || diffPathsMatch(c.path, file.oldPath))
        );
        const fileCommentCount = fileInlineComments.length;

        // Which line numbers are actually rendered in the diff table
        const diffLineNos = new Set<number>();
        (diffLines ?? [])
          .filter((l) => l.type !== 'meta' && l.type !== 'hunk')
          .forEach((l) => {
            if (l.newNo != null) diffLineNos.add(l.newNo);
            if (l.oldNo != null) diffLineNos.add(l.oldNo);
          });
        // Comments that have no matching line in the visible diff
        const fallbackComments = (canExpand && isExp)
          ? fileInlineComments.filter((c) => {
              const line = asLineNumber(c.line);
              return line == null || !diffLineNos.has(line);
            })
          : fileInlineComments;
        // Split fallback: line=null/0 are intentional file-level comments; others are truly out-of-range
        const fileLevelFallback = fallbackComments.filter((c) => {
          const line = asLineNumber(c.line);
          return line == null || line === 0;
        });
        const outOfRangeFallback = fallbackComments.filter((c) => {
          const line = asLineNumber(c.line);
          return line != null && line !== 0;
        });

        return (
          <div key={file.path} className="border border-border rounded-md overflow-hidden bg-canvas">
            {/* File header */}
            <div
              className={clsx(
                'flex items-center gap-2 px-3 py-2 bg-canvas-subtle',
                canExpand && 'cursor-pointer hover:bg-canvas-overlay transition-colors'
              )}
              onClick={() => canExpand && toggle(file.path)}
            >
              {canExpand ? (
                isExp ? <ChevronDown size={14} className="text-fg-muted flex-shrink-0" /> : <ChevronRight size={14} className="text-fg-muted flex-shrink-0" />
              ) : null}
              <FileText size={14} className="text-fg-muted flex-shrink-0" />
              {statusIcon[file.status.toLowerCase()] ?? statusIcon.modified}
              <span className="flex-1 text-sm font-mono text-fg truncate">
                {file.oldPath && file.oldPath !== file.path ? `${file.oldPath} → ${file.path}` : file.path}
              </span>
              {fileCommentCount > 0 && (
                <span className="text-xs text-fg-muted bg-canvas-overlay px-1.5 py-0.5 rounded-full">{fileCommentCount} comment{fileCommentCount !== 1 ? 's' : ''}</span>
              )}
              {onAddComment && currentUser && (
                <button
                  title="Comment on file"
                  className={clsx(
                    'p-1 rounded text-fg-muted hover:text-fg hover:bg-canvas-overlay transition-colors flex-shrink-0',
                    commentFormLine?.rowKey === `file:${file.path}` && 'text-accent bg-accent-subtle'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    const rowKey = `file:${file.path}`;
                    setCommentFormLine(commentFormLine?.rowKey === rowKey ? null : { path: file.path, line: null, rowKey });
                  }}
                >
                  <MessageSquare size={13} />
                </button>
              )}
              <div className="flex items-center gap-1 text-xs flex-shrink-0 ml-1">
                <span className="text-success-fg font-medium">+{file.additions}</span>
                <span className="text-danger-fg font-medium">-{file.deletions}</span>
              </div>
              <div className="hidden sm:flex gap-0.5 flex-shrink-0 ml-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const total = file.additions + file.deletions;
                  const addRatio = total > 0 ? file.additions / total : 0;
                  return <div key={i} className={clsx('w-2 h-3 rounded-sm', i / 5 < addRatio ? 'bg-success-emphasis' : 'bg-danger-emphasis')} />;
                })}
              </div>
            </div>

            {/* File-level comment form */}
            {commentFormLine?.rowKey === `file:${file.path}` && (
              <div className="border-t border-border">
                <InlineCommentForm
                  currentUser={currentUser}
                  onSubmit={async (body) => {
                    if (onAddComment) {
                      await onAddComment(file.path, null, body, headCommitSha ?? null);
                      setCommentFormLine(null);
                    }
                  }}
                  onCancel={() => setCommentFormLine(null)}
                />
              </div>
            )}

            {/* Diff lines */}
            {canExpand && isExp && diffLines && (
              <div className="overflow-x-auto border-t border-border">
                <table className="w-full border-collapse text-xs font-mono" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '40px' }} />
                    <col style={{ width: '40px' }} />
                    <col style={{ width: '20px' }} />
                    <col />
                  </colgroup>
                  <tbody>
                    {diffLines.filter((l) => l.type !== 'meta').map((line, i) => {
                      if (line.type === 'hunk') {
                        return (
                          <tr key={i} className="bg-accent-subtle">
                            <td className="px-1 py-0.5 text-right text-fg-muted border-r border-border/30 select-none" />
                            <td className="px-1 py-0.5 text-right text-fg-muted border-r border-border/30 select-none" />
                            <td className="border-r border-border/30" />
                            <td className="px-3 py-0.5 text-accent-fg whitespace-pre overflow-hidden">{line.content}</td>
                          </tr>
                        );
                      }

                      const lineNo = line.newNo ?? line.oldNo;
                      const rowKey = `${file.path}:${i}:${line.type}:${line.oldNo ?? 'n'}:${line.newNo ?? 'n'}`;
                      const lineComments = lineNo == null
                        ? []
                        : fileInlineComments.filter((c) => {
                            const cLine = asLineNumber(c.line);
                            return cLine != null && (cLine === line.newNo || cLine === line.oldNo);
                          });
                      const showForm = commentFormLine?.path === file.path && commentFormLine?.rowKey === rowKey;

                      const bgClass =
                        line.type === 'add' ? 'bg-[#1a3628]' :
                        line.type === 'remove' ? 'bg-[#3d1a1f]' : '';
                      const numBgClass =
                        line.type === 'add' ? 'bg-[#1a3628]' :
                        line.type === 'remove' ? 'bg-[#3d1a1f]' : 'bg-canvas-subtle';
                      const textClass =
                        line.type === 'add' ? 'text-[#57ab5a]' :
                        line.type === 'remove' ? 'text-[#f47067]' : 'text-fg';
                      const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';
                      const prefixColor =
                        line.type === 'add' ? 'text-success-fg' :
                        line.type === 'remove' ? 'text-danger-fg' : 'text-fg-subtle';

                      return (
                        <React.Fragment key={i}>
                          <tr className={clsx(bgClass, 'group')}>
                            <td className={clsx('px-1 py-px text-right select-none text-fg-muted border-r border-border/30 text-[11px]', numBgClass)}>
                              {line.oldNo ?? ''}
                            </td>
                            <td className={clsx('px-1 py-px text-right select-none text-fg-muted border-r border-border/30 text-[11px]', numBgClass)}>
                              {line.newNo ?? ''}
                            </td>
                            <td className={clsx('border-r border-border/30 text-center', numBgClass)}>
                              {onAddComment && lineNo != null && currentUser && (
                                <button
                                  title="Add a comment"
                                  className={clsx(
                                    'w-4 h-4 mx-auto flex items-center justify-center rounded-sm text-white text-[10px]',
                                    'bg-accent opacity-0 group-hover:opacity-100 transition-opacity',
                                    showForm && 'opacity-100'
                                  )}
                                  onClick={() => setCommentFormLine(showForm ? null : { path: file.path, line: lineNo, rowKey })}
                                >
                                  <Plus size={9} />
                                </button>
                              )}
                            </td>
                            <td className={clsx('py-px whitespace-pre overflow-hidden', bgClass)}>
                              <span className={clsx('pl-2 pr-1 select-none', prefixColor)}>{prefix}</span>
                              <span className={textClass}>{line.content}</span>
                            </td>
                          </tr>

                          {/* Existing inline comments */}
                          {lineComments.map((c) => (
                            <tr key={c.id}>
                              <td colSpan={4} className="p-0">
                                <InlineCommentBlock
                                  comment={c}
                                  currentUser={currentUser}
                                  onUpdate={onUpdateComment}
                                  onDelete={onDeleteComment}
                                  isOutdated={headCommitSha != null && c.commitSha != null && c.commitSha !== headCommitSha}
                                />
                              </td>
                            </tr>
                          ))}

                          {/* Inline comment form */}
                          {showForm && lineNo != null && (
                            <tr key={`form-${rowKey}`}>
                              <td colSpan={4} className="p-0">
                                <InlineCommentForm
                                  currentUser={currentUser}
                                  onSubmit={async (body) => {
                                    if (onAddComment) {
                                      await onAddComment(file.path, lineNo, body, headCommitSha ?? null);
                                      setCommentFormLine(null);
                                    }
                                  }}
                                  onCancel={() => setCommentFormLine(null)}
                                />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* File-level comments (no specific line) */}
            {fileLevelFallback.length > 0 && (!canExpand || isExp) && (
              <div className="border-t border-border">
                <div className="px-3 py-1.5 bg-canvas-subtle text-xs text-fg-muted border-b border-border/50 flex items-center gap-1">
                  <MessageSquare size={11} />
                  {`${fileLevelFallback.length} comment${fileLevelFallback.length !== 1 ? 's' : ''} on this file`}
                </div>
                <div className="divide-y divide-border/30">
                  {fileLevelFallback.map(c => (
                    <InlineCommentBlock
                      key={c.id}
                      comment={c}
                      currentUser={currentUser}
                      onUpdate={onUpdateComment}
                      onDelete={onDeleteComment}
                      isOutdated={headCommitSha != null && c.commitSha != null && c.commitSha !== headCommitSha}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Comments for this file that couldn't be matched to a visible diff line */}
            {outOfRangeFallback.length > 0 && (!canExpand || isExp) && (
              <div className="border-t border-border">
                <div className="px-3 py-1.5 bg-canvas-subtle text-xs text-fg-muted border-b border-border/50 flex items-center gap-1">
                  <MessageSquare size={11} />
                  {canExpand
                    ? `${outOfRangeFallback.length} comment${outOfRangeFallback.length !== 1 ? 's' : ''} on lines not visible in this diff`
                    : `${outOfRangeFallback.length} comment${outOfRangeFallback.length !== 1 ? 's' : ''} on this file`}
                </div>
                <div className="divide-y divide-border/30">
                  {[...outOfRangeFallback]
                    .sort((a, b) => (a.line ?? 0) - (b.line ?? 0))
                    .map(c => (
                      <div key={c.id}>
                        <div className="px-4 py-1 bg-canvas-overlay/50 text-[11px] text-fg-muted font-mono border-b border-border/30">
                          Line {c.line}
                        </div>
                        <InlineCommentBlock
                          comment={c}
                          currentUser={currentUser}
                          onUpdate={onUpdateComment}
                          onDelete={onDeleteComment}
                          isOutdated={headCommitSha != null && c.commitSha != null && c.commitSha !== headCommitSha}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
