'use client';

import { useState } from 'react';
import { PRReview } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';
import { CheckCircle2, XCircle, MessageSquare, Eye, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import Link from 'next/link';

interface ReviewItemProps {
  review: PRReview;
  isStale?: boolean;
}

export default function ReviewItem({ review, isStale }: ReviewItemProps) {
  const { state, reviewer, body, submittedAt, dismissed, dismissReason } = review;
  const [expanded, setExpanded] = useState(!isStale);

  const staleBadge = isStale ? (
    <span className="flex items-center gap-1 text-xs text-fg-muted bg-canvas-subtle border border-border px-1.5 py-0.5 rounded-full">
      <Clock size={10} /> Stale
    </span>
  ) : null;

  if (state === 'APPROVED') {
    return (
      <div className={`rounded-md overflow-hidden border ${isStale ? 'border-border opacity-70' : 'border-[#2ea043]/50'}`}>
        <button
          className={`flex items-center gap-3 px-4 py-3 ${isStale ? 'bg-canvas-overlay' : 'bg-[#1a3628]'} border-b border-border w-full text-left`}
          onClick={() => setExpanded((e) => !e)}
        >
          <div className={`w-7 h-7 rounded-full ${isStale ? 'bg-canvas-subtle border-border' : 'bg-[#2ea043]/20 border-[#2ea043]/50'} border flex items-center justify-center flex-shrink-0`}>
            <CheckCircle2 size={15} className={isStale ? 'text-fg-muted' : 'text-[#3fb950]'} />
          </div>
          <Avatar src={reviewer.avatarUrl} name={reviewer.displayName || reviewer.username} size={20} />
          <span className="text-sm text-fg flex-1 text-left">
            <Link href={`/${reviewer.username}`} className="font-semibold hover:text-accent-fg" onClick={(e) => e.stopPropagation()}>
              {reviewer.username}
            </Link>
            {' approved these changes'}
          </span>
          {staleBadge}
          <span className="text-xs text-fg-muted whitespace-nowrap ml-2">{formatRelativeTime(submittedAt)}</span>
          {isStale && (expanded ? <ChevronDown size={13} className="text-fg-muted ml-1" /> : <ChevronRight size={13} className="text-fg-muted ml-1" />)}
        </button>
        {expanded && body && (
          <div className="px-4 py-3 bg-canvas text-sm text-fg">
            <MarkdownRenderer>{body}</MarkdownRenderer>
          </div>
        )}
      </div>
    );
  }

  if (state === 'CHANGES_REQUESTED') {
    return (
      <div className={`rounded-md overflow-hidden border ${isStale ? 'border-border opacity-70' : 'border-[#f85149]/40'}`}>
        <button
          className={`flex items-center gap-3 px-4 py-3 ${isStale ? 'bg-canvas-overlay' : 'bg-[#3d1a1f]'} border-b border-border w-full text-left`}
          onClick={() => setExpanded((e) => !e)}
        >
          <div className={`w-7 h-7 rounded-full ${isStale ? 'bg-canvas-subtle border-border' : 'bg-[#f85149]/15 border-[#f85149]/40'} border flex items-center justify-center flex-shrink-0`}>
            <XCircle size={15} className={isStale ? 'text-fg-muted' : 'text-[#f85149]'} />
          </div>
          <Avatar src={reviewer.avatarUrl} name={reviewer.displayName || reviewer.username} size={20} />
          <span className="text-sm text-fg flex-1 text-left">
            <Link href={`/${reviewer.username}`} className="font-semibold hover:text-accent-fg" onClick={(e) => e.stopPropagation()}>
              {reviewer.username}
            </Link>
            {' requested changes'}
          </span>
          {staleBadge}
          <span className="text-xs text-fg-muted whitespace-nowrap ml-2">{formatRelativeTime(submittedAt)}</span>
          {isStale && (expanded ? <ChevronDown size={13} className="text-fg-muted ml-1" /> : <ChevronRight size={13} className="text-fg-muted ml-1" />)}
        </button>
        {expanded && body && (
          <div className="px-4 py-3 bg-canvas text-sm text-fg">
            <MarkdownRenderer>{body}</MarkdownRenderer>
          </div>
        )}
      </div>
    );
  }

  // COMMENTED or DISMISSED
  const isDismissed = state === 'DISMISSED' || dismissed;
  const icon = isDismissed
    ? <Eye size={15} className="text-fg-muted" />
    : <MessageSquare size={15} className="text-fg-muted" />;
  const label = isDismissed ? 'dismissed their review' : 'reviewed';

  return (
    <div className="rounded-md overflow-hidden border border-border">
      <button
        className="flex items-center gap-3 px-4 py-3 bg-canvas-overlay border-b border-border w-full text-left"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="w-7 h-7 rounded-full bg-canvas-subtle border border-border flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <Avatar src={reviewer.avatarUrl} name={reviewer.displayName || reviewer.username} size={20} />
        <span className="text-sm text-fg flex-1 text-left">
          <Link href={`/${reviewer.username}`} className="font-semibold hover:text-accent-fg" onClick={(e) => e.stopPropagation()}>
            {reviewer.username}
          </Link>
          {' ' + label}
        </span>
        {staleBadge}
        <span className="ml-auto text-xs text-fg-muted whitespace-nowrap">{formatRelativeTime(submittedAt)}</span>
        {(body || (isDismissed && dismissReason)) && (expanded ? <ChevronDown size={13} className="text-fg-muted ml-1" /> : <ChevronRight size={13} className="text-fg-muted ml-1" />)}
      </button>
      {expanded && (
        <>
          {isDismissed && dismissReason && (
            <div className="px-4 py-2 bg-canvas-subtle border-b border-border text-xs text-fg-muted italic">
              Dismiss reason: {dismissReason}
            </div>
          )}
          {body && (
            <div className="px-4 py-3 bg-canvas text-sm text-fg">
              <MarkdownRenderer>{body}</MarkdownRenderer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

