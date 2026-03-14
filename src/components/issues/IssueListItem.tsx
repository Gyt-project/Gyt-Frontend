import Link from 'next/link';
import { Issue, Label } from '@/types';
import { CircleDot, CheckCircle2, MessageSquare } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface IssueListItemProps {
  issue: Issue;
  owner: string;
  repo: string;
}

function LabelPill({ label }: { label: Label }) {
  const bg = `#${label.color}`;
  return (
    <span
      className="px-1.5 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: bg + '33', color: bg, border: `1px solid ${bg}66` }}
    >
      {label.name}
    </span>
  );
}

export default function IssueListItem({ issue, owner, repo }: IssueListItemProps) {
  const isOpen = issue.state === 'open';

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-canvas-subtle/50 transition-colors">
      {isOpen ? (
        <CircleDot size={16} className="text-success-fg flex-shrink-0 mt-0.5" />
      ) : (
        <CheckCircle2 size={16} className="text-purple-fg flex-shrink-0 mt-0.5" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-1.5">
          <Link
            href={`/${owner}/${repo}/issues/${issue.number}`}
            className="text-sm font-medium text-fg hover:text-accent-fg hover:underline"
          >
            {issue.title}
          </Link>
          {issue.labels.map((l) => (
            <LabelPill key={l.id} label={l} />
          ))}
        </div>
        <p className="text-xs text-fg-muted mt-0.5">
          #{issue.number} opened {formatRelativeTime(issue.createdAt)} by{' '}
          <Link href={`/${issue.author.username}`} className="hover:text-accent-fg transition-colors">
            {issue.author.username}
          </Link>
        </p>
      </div>

      {issue.commentCount > 0 && (
        <div className="flex items-center gap-1 text-xs text-fg-muted flex-shrink-0">
          <MessageSquare size={12} />
          {issue.commentCount}
        </div>
      )}
    </div>
  );
}
