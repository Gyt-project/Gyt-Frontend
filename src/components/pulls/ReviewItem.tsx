import { PRReview } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';
import { CheckCircle2, XCircle, MessageSquare, Eye } from 'lucide-react';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

interface ReviewItemProps {
  review: PRReview;
}

const stateConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  APPROVED: {
    icon: <CheckCircle2 size={14} />,
    label: 'approved',
    color: 'text-success-fg',
  },
  CHANGES_REQUESTED: {
    icon: <XCircle size={14} />,
    label: 'requested changes',
    color: 'text-danger-fg',
  },
  COMMENTED: {
    icon: <MessageSquare size={14} />,
    label: 'commented',
    color: 'text-fg-muted',
  },
  DISMISSED: {
    icon: <Eye size={14} />,
    label: 'dismissed review',
    color: 'text-fg-muted',
  },
};

export default function ReviewItem({ review }: ReviewItemProps) {
  const config = stateConfig[review.state] ?? stateConfig.COMMENTED;

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div className={`flex items-center gap-2 px-4 py-2 bg-canvas-subtle border-b border-border ${config.color}`}>
        {config.icon}
        <Avatar
          src={review.reviewer.avatarUrl}
          name={review.reviewer.displayName || review.reviewer.username}
          size={20}
        />
        <span className="text-sm font-medium text-fg">{review.reviewer.username}</span>
        <span className="text-sm">{config.label}</span>
        <span className="text-xs text-fg-muted ml-auto">
          {formatRelativeTime(review.submittedAt)}
        </span>
      </div>
      {review.body && (
        <div className="px-4 py-3 bg-canvas text-sm text-fg">
          <MarkdownRenderer>{review.body}</MarkdownRenderer>
        </div>
      )}
    </div>
  );
}
