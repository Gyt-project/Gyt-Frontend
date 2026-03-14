'use client';

import { useState } from 'react';
import { IssueComment, PRComment } from '@/types';
import { formatDateFull, formatRelativeTime } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { Pencil, Trash2 } from 'lucide-react';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

interface CommentItemProps {
  comment: IssueComment | PRComment;
  currentUsername?: string;
  onUpdate?: (id: string, body: string) => unknown;
  onDelete?: (id: string) => unknown;
}

export default function CommentItem({
  comment,
  currentUsername,
  onUpdate,
  onDelete,
}: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body);
  const [saving, setSaving] = useState(false);

  const isAuthor = currentUsername === comment.author.username;

  const save = async () => {
    if (!onUpdate) return;
    setSaving(true);
    try {
      await onUpdate(comment.id, body);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-border rounded-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-canvas-subtle border-b border-border">
        <div className="flex items-center gap-2">
          <Avatar src={comment.author.avatarUrl} name={comment.author.displayName || comment.author.username} size={24} />
          <span className="text-sm font-semibold text-fg">{comment.author.username}</span>
          <span className="text-xs text-fg-muted" title={formatDateFull(comment.createdAt)}>
            commented {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        {isAuthor && (
          <div className="flex gap-1">
            <button
              onClick={() => setEditing((e) => !e)}
              className="p-1 text-fg-muted hover:text-fg rounded transition-colors"
            >
              <Pencil size={13} />
            </button>
            {onDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                className="p-1 text-fg-muted hover:text-danger-fg rounded transition-colors"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-3 bg-canvas">
        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
            />
            <div className="flex gap-2">
              <Button size="sm" variant="primary" loading={saving} onClick={save}>
                Save
              </Button>
              <Button size="sm" onClick={() => { setEditing(false); setBody(comment.body); }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <MarkdownRenderer>{comment.body}</MarkdownRenderer>
        )}
      </div>
    </div>
  );
}
