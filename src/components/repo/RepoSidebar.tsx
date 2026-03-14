'use client';

import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { BookOpen, Activity, Star, GitFork, Tag as TagIcon, Users } from 'lucide-react';
import { GET_REPO_STATS, LIST_TAGS, LIST_COLLABORATORS, GET_USER } from '@/graphql/queries';
import { Repository, RepoStats, ListTagsResponse, ListCollaboratorsResponse, User } from '@/types';
import Avatar from '@/components/ui/Avatar';

interface Props {
  owner: string;
  repo: string;
  repository?: Repository;
}

function CollaboratorRow({ username }: { username: string }) {
  const { data } = useQuery<{ getUser: User }>(GET_USER, {
    variables: { username },
    errorPolicy: 'ignore',
  });
  const user = data?.getUser;
  return (
    <Link href={`/${username}`} className="flex items-center gap-2 hover:text-accent-fg transition-colors group">
      <Avatar src={user?.avatarUrl} name={user?.displayName || username} size={24} className="flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-sm text-fg group-hover:text-accent-fg truncate">{username}</p>
        {user?.displayName && (
          <p className="text-xs text-fg-muted truncate">{user.displayName}</p>
        )}
      </div>
    </Link>
  );
}

export default function RepoSidebar({ owner, repo, repository }: Props) {
  const { data: statsData } = useQuery<{ getRepositoryStats: RepoStats }>(GET_REPO_STATS, {
    variables: { owner, name: repo },
    errorPolicy: 'ignore',
  });
  const { data: tagsData } = useQuery<{ listTags: ListTagsResponse }>(LIST_TAGS, {
    variables: { owner, name: repo },
    errorPolicy: 'ignore',
  });
  const { data: collabData } = useQuery<{ listCollaborators: ListCollaboratorsResponse }>(
    LIST_COLLABORATORS,
    { variables: { owner, name: repo }, errorPolicy: 'ignore' }
  );

  const stats = statsData?.getRepositoryStats;
  const tags = tagsData?.listTags.tags ?? [];
  const collaborators = collabData?.listCollaborators.collaborators ?? [];

  const stars = repository?.stars ?? stats?.stars ?? 0;
  const forks = repository?.forks ?? stats?.forks ?? 0;

  return (
    <div className="space-y-5 text-sm">
      {/* About */}
      <div>
        <h3 className="font-semibold text-fg mb-2">About</h3>
        {repository?.description ? (
          <p className="text-fg-muted leading-relaxed">{repository.description}</p>
        ) : (
          <p className="text-fg-muted italic">No description provided.</p>
        )}
      </div>

      <div className="border-t border-border" />

      {/* Resources */}
      <div>
        <h3 className="font-semibold text-fg mb-2">Resources</h3>
        <ul className="space-y-1.5">
          <li>
            <Link
              href={`/${owner}/${repo}`}
              className="flex items-center gap-2 text-fg-muted hover:text-accent-fg transition-colors"
            >
              <BookOpen size={14} />
              Readme
            </Link>
          </li>
          <li>
            <Link
              href={`/${owner}/${repo}/commits`}
              className="flex items-center gap-2 text-fg-muted hover:text-accent-fg transition-colors"
            >
              <Activity size={14} />
              Activity
            </Link>
          </li>
        </ul>
      </div>

      <div className="border-t border-border" />

      {/* Stars & Forks */}
      <ul className="space-y-1.5">
        <li>
          <span className="flex items-center gap-2 text-fg-muted">
            <Star size={14} />
            <span>
              <strong className="text-fg">{stars}</strong> star{stars !== 1 ? 's' : ''}
            </span>
          </span>
        </li>
        <li>
          <span className="flex items-center gap-2 text-fg-muted">
            <GitFork size={14} />
            <span>
              <strong className="text-fg">{forks}</strong> fork{forks !== 1 ? 's' : ''}
            </span>
          </span>
        </li>
      </ul>

      <div className="border-t border-border" />

      {/* Releases / Tags */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Link
            href={`/${owner}/${repo}/tags`}
            className="flex items-center gap-1.5 font-semibold text-fg hover:text-accent-fg transition-colors"
          >
            <TagIcon size={14} />
            Releases
          </Link>
          {stats && stats.tagCount > 0 && (
            <span className="text-xs bg-canvas-subtle border border-border rounded-full px-1.5 py-0.5 text-fg-muted">
              {stats.tagCount}
            </span>
          )}
        </div>
        {tags.length === 0 ? (
          <div className="text-fg-muted space-y-1">
            <p>No releases published.</p>
            <Link href={`/${owner}/${repo}/tags`} className="text-accent-fg hover:underline text-xs">
              Create a new release
            </Link>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {tags.slice(0, 3).map((tag) => (
              <li key={tag.name}>
                <Link
                  href={`/${owner}/${repo}/tags`}
                  className="flex items-center gap-1.5 text-fg-muted hover:text-accent-fg transition-colors"
                >
                  <TagIcon size={12} className="flex-shrink-0" />
                  <span className="font-mono text-xs truncate">{tag.name}</span>
                </Link>
              </li>
            ))}
            {tags.length > 3 && (
              <li>
                <Link href={`/${owner}/${repo}/tags`} className="text-accent-fg hover:underline text-xs">
                  +{tags.length - 3} more releases
                </Link>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Contributors */}
      {collaborators.length > 0 && (
        <>
          <div className="border-t border-border" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="flex items-center gap-1.5 font-semibold text-fg">
                <Users size={14} />
                Contributors
              </h3>
              <span className="text-xs bg-canvas-subtle border border-border rounded-full px-1.5 py-0.5 text-fg-muted">
                {collaborators.length}
              </span>
            </div>
            <div className="space-y-2.5">
              {collaborators.map((c) => (
                <CollaboratorRow key={c.username} username={c.username} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
