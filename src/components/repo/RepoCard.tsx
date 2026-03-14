import Link from 'next/link';
import { Lock, Star, GitFork, Clock } from 'lucide-react';
import { Repository } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

interface RepoCardProps {
  repo: Repository;
  showOwner?: boolean;
}

export default function RepoCard({ repo, showOwner = false }: RepoCardProps) {
  const href = `/${repo.ownerName}/${repo.name}`;

  return (
    <div className="flex flex-col gap-2 p-4 border-b border-border last:border-0 hover:bg-canvas-subtle/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Link href={href} className="text-accent-fg font-semibold hover:underline truncate">
            {showOwner ? `${repo.ownerName}/${repo.name}` : repo.name}
          </Link>
          {repo.isPrivate && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs border border-border rounded-full text-fg-muted flex-shrink-0">
              <Lock size={10} />
              Private
            </span>
          )}
          {repo.isFork && (
            <span className="px-1.5 py-0.5 text-xs border border-border rounded-full text-fg-muted flex-shrink-0">
              Fork
            </span>
          )}
        </div>
      </div>

      {repo.description && (
        <p className="text-sm text-fg-muted line-clamp-2">{repo.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-fg-muted">
        <span className="flex items-center gap-1 hover:text-fg-muted">
          <Star size={12} />
          {repo.stars}
        </span>
        <span className="flex items-center gap-1">
          <GitFork size={12} />
          {repo.forks}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          Updated {formatRelativeTime(repo.updatedAt)}
        </span>
      </div>
    </div>
  );
}
