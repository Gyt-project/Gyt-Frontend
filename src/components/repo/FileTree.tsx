'use client';

import Link from 'next/link';
import { Folder, FileText } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { GET_FILE_HISTORY } from '@/graphql/queries';
import { TreeEntry, Commit } from '@/types';
import { formatRelativeTime, truncate } from '@/lib/utils';

interface FileTreeProps {
  entries: TreeEntry[];
  owner: string;
  repo: string;
  ref: string;
  currentPath?: string;
}

function LastCommitCell({ owner, repo, path, ref }: { owner: string; repo: string; path: string; ref: string }) {
  const { data } = useQuery<{ getFileHistory: { commits: Commit[] } }>(GET_FILE_HISTORY, {
    variables: { owner, name: repo, path, ref, limit: 1 },
    fetchPolicy: 'cache-first',
  });
  const commit = data?.getFileHistory.commits[0];
  if (!commit) return null;
  return (
    <>
      <Link
        href={`/${owner}/${repo}/commit/${commit.sha}`}
        className="hidden md:block text-xs text-fg-muted hover:text-accent-fg truncate max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {truncate(commit.message.split('\n')[0], 60)}
      </Link>
      <span className="hidden lg:block text-xs text-fg-subtle flex-shrink-0" title={commit.author.when}>
        {formatRelativeTime(commit.author.when)}
      </span>
    </>
  );
}

export default function FileTree({
  entries,
  owner,
  repo,
  ref,
  currentPath = '',
}: FileTreeProps) {
  const sorted = [...entries].sort((a, b) => {
    if (a.isDir && !b.isDir) return -1;
    if (!a.isDir && b.isDir) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="rounded-md border border-border overflow-hidden">
      {/* Parent dir link */}
      {currentPath && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-canvas-subtle hover:bg-canvas-overlay transition-colors">
          <Folder size={16} className="text-accent-fg flex-shrink-0" />
          <Link
            href={`/${owner}/${repo}?ref=${ref}&path=${encodeURIComponent(
              currentPath.split('/').slice(0, -1).join('/')
            )}`}
            className="text-sm text-accent-fg hover:underline"
          >
            ..
          </Link>
        </div>
      )}

      {sorted.map((entry) => {
        const filePath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
        const href = entry.isDir
          ? `/${owner}/${repo}?ref=${ref}&path=${encodeURIComponent(filePath)}`
          : `/${owner}/${repo}/blob/${ref}/${filePath}`;

        return (
          <div
            key={entry.path}
            className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0 hover:bg-canvas-subtle/60 transition-colors"
          >
            {entry.isDir ? (
              <Folder size={16} className="text-accent-fg flex-shrink-0" />
            ) : (
              <FileText size={16} className="text-fg-muted flex-shrink-0" />
            )}

            <Link href={href} className="text-sm text-fg hover:text-accent-fg hover:underline flex-1 min-w-0 truncate">
              {entry.name}
            </Link>

            <LastCommitCell owner={owner} repo={repo} path={filePath} ref={ref} />
          </div>
        );
      })}
    </div>
  );
}
