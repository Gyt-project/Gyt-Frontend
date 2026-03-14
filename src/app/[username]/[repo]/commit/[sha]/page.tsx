'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { GitCommit, User2 } from 'lucide-react';
import { GET_COMMIT, GET_REPOSITORY } from '@/graphql/queries';
import { CommitDetail, Repository } from '@/types';
import RepoLayout from '@/components/layout/RepoLayout';
import FileDiffList from '@/components/repo/FileDiffList';
import Spinner from '@/components/ui/Spinner';
import { formatDateFull, shortSha } from '@/lib/utils';
import Link from 'next/link';

export default function CommitPage() {
  const { username, repo, sha } = useParams<{ username: string; repo: string; sha: string }>();

  const { data: repoData } = useQuery<{ getRepository: Repository }>(GET_REPOSITORY, {
    variables: { owner: username, name: repo },
  });
  const { data, loading } = useQuery<{ getCommit: CommitDetail }>(GET_COMMIT, {
    variables: { owner: username, name: repo, sha },
  });

  const commitDetail = data?.getCommit;
  const c = commitDetail?.commit;

  return (
    <RepoLayout owner={username} repo={repo} repository={repoData?.getRepository}>
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : !commitDetail || !c ? (
        <p className="text-fg-muted text-center py-12">Commit not found.</p>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="border border-border rounded-md p-5 space-y-3">
            <h1 className="text-xl font-semibold text-fg">{c.message.split('\n')[0]}</h1>
            {c.message.includes('\n') && (
              <pre className="text-sm text-fg-muted whitespace-pre-wrap">
                {c.message.split('\n').slice(1).join('\n').trim()}
              </pre>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-fg-muted pt-1">
              <span className="flex items-center gap-1.5">
                <User2 size={14} />
                <Link href={`/${c.author.name}`} className="hover:text-accent-fg">
                  {c.author.name}
                </Link>
              </span>
              <span>{formatDateFull(c.author.when)}</span>
              <span className="flex items-center gap-1.5">
                <GitCommit size={14} />
                <code className="bg-canvas-subtle px-1.5 py-0.5 rounded text-xs font-mono">
                  {shortSha(c.sha)}
                </code>
              </span>
            </div>

            {/* Parents */}
            {c.parentShas?.length > 0 && (
              <div className="text-xs text-fg-muted">
                {c.parentShas.length === 1 ? 'Parent' : 'Parents'}:{' '}
                {c.parentShas.map((p) => (
                  <Link
                    key={p}
                    href={`/${username}/${repo}/commit/${p}`}
                    className="font-mono text-accent-fg hover:underline mr-2"
                  >
                    {shortSha(p)}
                  </Link>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex gap-4 text-sm pt-1">
              <span className="text-success-fg">+{commitDetail.totalAdditions}</span>
              <span className="text-danger-fg">-{commitDetail.totalDeletions}</span>
              <span className="text-fg-muted">
                {commitDetail.filesChanged} file{commitDetail.filesChanged !== 1 ? 's' : ''} changed
              </span>
            </div>
          </div>

          {/* Files changed */}
          {commitDetail.files.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-fg mb-2">
                Files changed ({commitDetail.files.length})
              </h2>
              <FileDiffList files={commitDetail.files} patch={commitDetail.patch} />
            </section>
          )}
        </div>
      )}
    </RepoLayout>
  );
}
