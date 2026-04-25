import { PRReview } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';
import { CheckCircle2, XCircle, MessageSquare, Eye } from 'lucide-react';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import Link from 'next/link';

interface ReviewItemProps {
  review: PRReview;
}

export default function ReviewItem({ review }: ReviewItemProps) {
  const { state, reviewer, body, submittedAt } = review;

  if (state === 'APPROVED') {
    return (
      <div className="rounded-md overflow-hidden border border-[#2ea043]/50">
        <div className="flex items-center gap-3 px-4 py-3 bg-[#1a3628] border-b border-[#2ea043]/40">
          <div className="w-7 h-7 rounded-full bg-[#2ea043]/20 border border-[#2ea043]/50 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={15} className="text-[#3fb950]" />
          </div>
          <Avatar src={reviewer.avatarUrl} name={reviewer.displayName || reviewer.username} size={20} />
          <span className="text-sm text-fg">
            <Link href={`/${reviewer.username}`} className="font-semibold hover:text-accent-fg">
              {reviewer.username}
            </Link>
            {' approved these changes'}
          </span>
          <span className="ml-auto text-xs text-fg-muted whitespace-nowrap">{formatRelativeTime(submittedAt)}</span>
        </div>
        {body && (
          <div className="px-4 py-3 bg-canvas text-sm text-fg">
            <MarkdownRenderer>{body}</MarkdownRenderer>
          </div>
        )}
      </div>
    );
  }

  if (state === 'CHANGES_REQUESTED') {
    return (
      <div className="rounded-md overflow-hidden border border-[#f85149]/40">
        <div className="flex items-center gap-3 px-4 py-3 bg-[#3d1a1f] border-b border-[#f85149]/30">
          <div className="w-7 h-7 rounded-full bg-[#f85149]/15 border border-[#f85149]/40 flex items-center justify-center flex-shrink-0">
            <XCircle size={15} className="text-[#f85149]" />
          </div>
          <Avatar src={reviewer.avatarUrl} name={reviewer.displayName || reviewer.username} size={20} />
          <span className="text-sm text-fg">
            <Link href={`/${reviewer.username}`} className="font-semibold hover:text-accent-fg">
              {reviewer.username}
            </Link>
            {' requested changes'}
          </span>
          <span className="ml-auto text-xs text-fg-muted whitespace-nowrap">{formatRelativeTime(submittedAt)}</span>
        </div>
        {body && (
          <div className="px-4 py-3 bg-canvas text-sm text-fg">
            <MarkdownRenderer>{body}</MarkdownRenderer>
          </div>
        )}
      </div>
    );
  }

  // COMMENTED or DISMISSED
  const icon =
    state === 'DISMISSED'
      ? <Eye size={15} className="text-fg-muted" />
      : <MessageSquare size={15} className="text-fg-muted" />;
  const label = state === 'DISMISSED' ? 'dismissed their review' : 'reviewed';

  return (
    <div className="rounded-md overflow-hidden border border-border">
      <div className="flex items-center gap-3 px-4 py-3 bg-canvas-overlay border-b border-border">
        <div className="w-7 h-7 rounded-full bg-canvas-subtle border border-border flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <Avatar src={reviewer.avatarUrl} name={reviewer.displayName || reviewer.username} size={20} />
        <span className="text-sm text-fg">
          <Link href={`/${reviewer.username}`} className="font-semibold hover:text-accent-fg">
            {reviewer.username}
          </Link>
          {' ' + label}
        </span>
        <span className="ml-auto text-xs text-fg-muted whitespace-nowrap">{formatRelativeTime(submittedAt)}</span>
      </div>
      {body && (
        <div className="px-4 py-3 bg-canvas text-sm text-fg">
          <MarkdownRenderer>{body}</MarkdownRenderer>
        </div>
      )}
    </div>
  );
}
