import Link from 'next/link';
import { Commit } from '@/types';
import { shortSha, formatRelativeTime, truncate } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';

interface CommitItemProps {
  commit: Commit;
  owner: string;
  repo: string;
}

export default function CommitItem({ commit, owner, repo }: CommitItemProps) {
  const firstLine = commit.message.split('\n')[0];
  const body = commit.message.split('\n').slice(1).filter(Boolean).join('\n');

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-canvas-subtle/50 transition-colors">
      <Avatar name={commit.author.name} size={28} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <Link
          href={`/${owner}/${repo}/commit/${commit.sha}`}
          className="text-sm font-medium text-fg hover:text-accent-fg hover:underline block truncate"
        >
          {truncate(firstLine, 80)}
        </Link>
        <div className="flex items-center gap-2 mt-1 text-xs text-fg-muted">
          <span>{commit.author.name}</span>
          <span>committed</span>
          <span>{formatRelativeTime(commit.author.when)}</span>
        </div>
      </div>
      <Link
        href={`/${owner}/${repo}/commit/${commit.sha}`}
        className="font-mono text-xs text-accent-fg hover:underline flex-shrink-0 px-2 py-0.5 rounded border border-border hover:bg-canvas-overlay transition-colors"
      >
        {shortSha(commit.sha)}
      </Link>
    </div>
  );
}
