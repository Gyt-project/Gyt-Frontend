'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, CornerDownRight, X } from 'lucide-react';
import { clsx } from 'clsx';
import { ChatPayload, UserInfo } from '@/lib/live-client';
import Avatar from '@/components/ui/Avatar';
import { formatRelativeTime } from '@/lib/utils';

interface ChatPanelProps {
  messages: ChatPayload[];
  currentUserId: number;
  participants: UserInfo[];
  onSend: (body: string, parentId?: number) => void;
  className?: string;
}

/** A single chat bubble with its replies nested below it. */
function ChatBubble({
  msg,
  replies,
  isOwn,
  currentUserId,
  onReply,
  allMessages,
}: {
  msg: ChatPayload;
  replies: ChatPayload[];
  isOwn: boolean;
  currentUserId: number;
  onReply: (msg: ChatPayload) => void;
  allMessages: ChatPayload[];
}) {
  return (
    <div className="flex flex-col gap-1">
      {/* Top-level message */}
      <div className={clsx('flex gap-2 group', isOwn && 'flex-row-reverse')}>
        <Avatar name={msg.username} size={28} className="flex-shrink-0 mt-0.5" />
        <div className={clsx('max-w-[75%]', isOwn && 'items-end flex flex-col')}>
          <div className={clsx('flex items-baseline gap-2 mb-0.5', isOwn && 'flex-row-reverse')}>
            <span className="text-xs font-medium text-fg">{msg.username}</span>
            <span className="text-[10px] text-fg-muted">{formatRelativeTime(msg.createdAt)}</span>
          </div>
          <div className={clsx(
            'px-3 py-2 rounded-xl text-sm text-fg break-words whitespace-pre-wrap',
            isOwn
              ? 'bg-accent-emphasis text-white rounded-tr-sm'
              : 'bg-canvas-subtle border border-border rounded-tl-sm',
          )}>
            {msg.body}
          </div>
          {/* Reply button — shown on hover */}
          <button
            onClick={() => onReply(msg)}
            className="mt-1 flex items-center gap-1 text-[10px] text-fg-muted hover:text-fg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <CornerDownRight size={10} /> Reply
          </button>
        </div>
      </div>

      {/* Nested replies */}
      {replies.length > 0 && (
        <div className={clsx('flex flex-col gap-1 pl-10 border-l-2 border-border ml-4')}>
          {replies.map((r) => {
            const replyIsOwn = r.userId === currentUserId;
            return (
              <div key={r.id} className={clsx('flex gap-2 group', replyIsOwn && 'flex-row-reverse')}>
                <Avatar name={r.username} size={22} className="flex-shrink-0 mt-0.5" />
                <div className={clsx('max-w-[80%]', replyIsOwn && 'items-end flex flex-col')}>
                  <div className={clsx('flex items-baseline gap-2 mb-0.5', replyIsOwn && 'flex-row-reverse')}>
                    <span className="text-xs font-medium text-fg">{r.username}</span>
                    <span className="text-[10px] text-fg-muted">{formatRelativeTime(r.createdAt)}</span>
                  </div>
                  <div className={clsx(
                    'px-2.5 py-1.5 rounded-xl text-sm text-fg break-words whitespace-pre-wrap',
                    replyIsOwn
                      ? 'bg-accent-emphasis text-white rounded-tr-sm'
                      : 'bg-canvas-subtle border border-border rounded-tl-sm',
                  )}>
                    {r.body}
                  </div>
                  <button
                    onClick={() => onReply(msg)} // reply to the top-level thread
                    className="mt-0.5 flex items-center gap-1 text-[10px] text-fg-muted hover:text-fg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <CornerDownRight size={10} /> Reply
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ChatPanel({
  messages,
  currentUserId,
  onSend,
  className,
}: ChatPanelProps) {
  const [draft, setDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatPayload | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Focus input when replying
  useEffect(() => {
    if (replyingTo) inputRef.current?.focus();
  }, [replyingTo]);

  function handleSend() {
    const text = draft.trim();
    if (!text) return;
    onSend(text, replyingTo?.id);
    setDraft('');
    setReplyingTo(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      setReplyingTo(null);
    }
  }

  // Build message tree: separate top-level from replies
  const topLevel = messages.filter((m) => !m.parentId);
  const repliesMap = new Map<number, ChatPayload[]>();
  for (const m of messages) {
    if (m.parentId) {
      const arr = repliesMap.get(m.parentId) ?? [];
      arr.push(m);
      repliesMap.set(m.parentId, arr);
    }
  }

  return (
    <div className={clsx('flex flex-col bg-canvas-default border border-border rounded-md overflow-hidden', className)}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-border bg-canvas-subtle">
        <span className="text-sm font-semibold text-fg">Lobby Chat</span>
        <span className="ml-2 text-xs text-fg-muted">{topLevel.length} message{topLevel.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 min-h-0">
        {topLevel.length === 0 && (
          <p className="text-xs text-fg-muted text-center py-4">No messages yet. Start the conversation!</p>
        )}
        {topLevel.map((msg) => (
          <ChatBubble
            key={msg.id}
            msg={msg}
            replies={repliesMap.get(msg.id) ?? []}
            isOwn={msg.userId === currentUserId}
            currentUserId={currentUserId}
            onReply={setReplyingTo}
            allMessages={messages}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply context banner */}
      {replyingTo && (
        <div className="border-t border-border px-3 py-1.5 bg-canvas-subtle flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-fg-muted truncate">
            <CornerDownRight size={12} />
            <span>Replying to <strong className="text-fg">{replyingTo.username}</strong>:</span>
            <span className="truncate italic">{replyingTo.body.slice(0, 60)}{replyingTo.body.length > 60 ? '…' : ''}</span>
          </div>
          <button onClick={() => setReplyingTo(null)} className="flex-shrink-0 text-fg-muted hover:text-fg">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-2 flex gap-2">
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={replyingTo ? `Reply to ${replyingTo.username}… (Enter to send, Esc to cancel)` : 'Type a message… (Enter to send)'}
          rows={2}
          className="flex-1 resize-none bg-canvas-subtle border border-border rounded-md px-2 py-1.5 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-1 focus:ring-accent-emphasis"
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim()}
          className="self-end p-2 rounded-md bg-accent-emphasis text-white disabled:opacity-40 hover:bg-accent-emphasis/80 transition-colors"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
