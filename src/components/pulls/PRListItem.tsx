import Link from 'next/link';
import { PullRequest } from '@/types';
import { GitPullRequest, GitMerge, XCircle, MessageSquare } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface PRListItemProps {
  pr: PullRequest;
  owner: string;
  repo: string;
}

export default function PRListItem({ pr, owner, repo }: PRListItemProps) {
  const icon =
    pr.merged ? (
      <GitMerge size={16} className="text-purple-fg flex-shrink-0 mt-0.5" />
    ) : pr.state === 'open' ? (
      <GitPullRequest size={16} className="text-success-fg flex-shrink-0 mt-0.5" />
    ) : (
      <XCircle size={16} className="text-danger-fg flex-shrink-0 mt-0.5" />
    );

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-canvas-subtle/50 transition-colors">
      {icon}

      <div className="flex-1 min-w-0">
        <Link
          href={`/${owner}/${repo}/pulls/${pr.number}`}
          className="text-sm font-medium text-fg hover:text-accent-fg hover:underline"
        >
          {pr.title}
        </Link>
        <p className="text-xs text-fg-muted mt-0.5">
          #{pr.number} {pr.merged ? 'merged' : pr.state === 'open' ? 'opened' : 'closed'}{' '}
          {formatRelativeTime(pr.createdAt)} by{' '}
          <Link href={`/${pr.author.username}`} className="hover:text-accent-fg transition-colors">
            {pr.author.username}
          </Link>
          {' · '}
          <span className="font-mono text-xs">
            {pr.headBranch} → {pr.baseBranch}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-3 text-xs text-fg-muted flex-shrink-0">
        {pr.commentCount > 0 && (
          <span className="flex items-center gap-1">
            <MessageSquare size={12} />
            {pr.commentCount}
          </span>
        )}
        <span className="text-success-fg">+{pr.additions}</span>
        <span className="text-danger-fg">-{pr.deletions}</span>
      </div>
    </div>
  );
}
