import Link from 'next/link';
import { PullRequest, Label } from '@/types';
import { GitPullRequest, GitMerge, XCircle, MessageSquare } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface PRListItemProps {
  pr: PullRequest;
  owner: string;
  repo: string;
}

function LabelPill({ label, owner, repo }: { label: Label; owner: string; repo: string }) {
  const bg = `#${label.color}`;
  return (
    <Link
      href={`/${owner}/${repo}/pulls?label=${encodeURIComponent(label.name)}`}
      onClick={(e) => e.stopPropagation()}
      className="px-2 py-0.5 rounded-full text-xs font-medium leading-tight hover:opacity-75 transition-opacity"
      style={{ backgroundColor: bg + '22', color: bg, border: `1px solid ${bg}44` }}
    >
      {label.name}
    </Link>
  );
}

function AssigneeAvatars({ users }: { users: { username: string }[] }) {
  return (
    <div className="flex items-center -space-x-1.5">
      {users.slice(0, 3).map((u) => (
        <Link
          key={u.username}
          href={`/${u.username}`}
          title={u.username}
          className="block w-5 h-5 rounded-full bg-canvas-overlay border border-border flex items-center justify-center text-[9px] font-bold text-fg-muted uppercase ring-1 ring-canvas-default hover:z-10 transition-transform hover:scale-110"
        >
          {u.username[0]}
        </Link>
      ))}
    </div>
  );
}

export default function PRListItem({ pr, owner, repo }: PRListItemProps) {
  const StateIcon = pr.merged
    ? <GitMerge size={16} className="text-purple-fg shrink-0 mt-0.5" />
    : pr.state === 'open'
    ? <GitPullRequest size={16} className="text-success-fg shrink-0 mt-0.5" />
    : <XCircle size={16} className="text-danger-fg shrink-0 mt-0.5" />;

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-canvas-subtle transition-colors">
      {StateIcon}

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <Link
            href={`/${owner}/${repo}/pulls/${pr.number}`}
            className="text-sm font-semibold text-fg hover:text-blue-400 transition-colors"
          >
            {pr.title}
          </Link>
          {pr.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {pr.labels.map((l) => <LabelPill key={l.id} label={l} owner={owner} repo={repo} />)}
            </div>
          )}
        </div>
        <p className="text-xs text-fg-muted mt-0.5">
          #{pr.number}{' '}
          {pr.merged ? 'merged' : pr.state === 'open' ? 'opened' : 'closed'}{' '}
          {formatRelativeTime(pr.createdAt)} by{' '}
          <Link href={`/${pr.author.username}`} className="font-medium hover:underline">
            {pr.author.username}
          </Link>
          {' · '}
          <span className="font-mono text-[11px]">{pr.headBranch}</span>
          {' → '}
          <span className="font-mono text-[11px]">{pr.baseBranch}</span>
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-2">
        {pr.assignees.length > 0 && <AssigneeAvatars users={pr.assignees} />}
        {pr.commentCount > 0 && (
          <Link
            href={`/${owner}/${repo}/pulls/${pr.number}`}
            className="flex items-center gap-1 text-xs text-fg-muted hover:text-fg transition-colors"
          >
            <MessageSquare size={13} />
            <span>{pr.commentCount}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
