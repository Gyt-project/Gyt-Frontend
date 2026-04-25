import Link from 'next/link';
import { Issue, Label } from '@/types';
import { CircleDot, CheckCircle2, MessageSquare } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface IssueListItemProps {
  issue: Issue;
  owner: string;
  repo: string;
}

function LabelPill({ label, owner, repo }: { label: Label; owner: string; repo: string }) {
  const bg = `#${label.color}`;
  return (
    <Link
      href={`/${owner}/${repo}/issues?label=${encodeURIComponent(label.name)}`}
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

export default function IssueListItem({ issue, owner, repo }: IssueListItemProps) {
  const isOpen = issue.state === 'open';

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-canvas-subtle transition-colors">
      {isOpen ? (
        <CircleDot size={16} className="text-success-fg shrink-0 mt-0.5" />
      ) : (
        <CheckCircle2 size={16} className="text-purple-fg shrink-0 mt-0.5" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <Link
            href={`/${owner}/${repo}/issues/${issue.number}`}
            className="text-sm font-semibold text-fg hover:text-blue-400 transition-colors"
          >
            {issue.title}
          </Link>
          {issue.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {issue.labels.map((l) => <LabelPill key={l.id} label={l} owner={owner} repo={repo} />)}
            </div>
          )}
        </div>
        <p className="text-xs text-fg-muted mt-0.5">
          #{issue.number} {isOpen ? 'opened' : 'closed'}{' '}
          {formatRelativeTime(issue.createdAt)} by{' '}
          <Link href={`/${issue.author.username}`} className="font-medium hover:underline">
            {issue.author.username}
          </Link>
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-2">
        {issue.assignees.length > 0 && <AssigneeAvatars users={issue.assignees} />}
        {issue.commentCount > 0 && (
          <Link
            href={`/${owner}/${repo}/issues/${issue.number}`}
            className="flex items-center gap-1 text-xs text-fg-muted hover:text-fg transition-colors"
          >
            <MessageSquare size={13} />
            <span>{issue.commentCount}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
