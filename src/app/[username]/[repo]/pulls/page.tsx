'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { GitPullRequest, CircleDot, XCircle, GitMerge, Plus } from 'lucide-react';
import { LIST_PULL_REQUESTS, GET_REPOSITORY } from '@/graphql/queries';
import { Repository, ListPRsResponse } from '@/types';
import RepoLayout from '@/components/layout/RepoLayout';
import PRListItem from '@/components/pulls/PRListItem';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import { useAuth } from '@/context/AuthContext';

export default function PullsPage() {
  const { username, repo } = useParams<{ username: string; repo: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [state, setState] = useState<'open' | 'closed' | 'merged'>('open');
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data: repoData } = useQuery<{ getRepository: Repository }>(GET_REPOSITORY, {
    variables: { owner: username, name: repo },
  });
  const { data, loading } = useQuery<{ listPullRequests: ListPRsResponse }>(LIST_PULL_REQUESTS, {
    variables: { owner: username, repo, state, page, perPage: limit },
  });

  const prs = data?.listPullRequests.pullRequests ?? [];
  const total = data?.listPullRequests.total ?? 0;

  const stateButtons = [
    { label: 'Open', value: 'open', icon: <CircleDot size={14} className="text-success-fg" /> },
    { label: 'Closed', value: 'closed', icon: <XCircle size={14} className="text-danger-fg" /> },
    { label: 'Merged', value: 'merged', icon: <GitMerge size={14} className="text-purple-fg" /> },
  ] as const;

  return (
    <RepoLayout owner={username} repo={repo} repository={repoData?.getRepository}>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1 text-sm">
            {stateButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => { setState(btn.value); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium ${
                  state === btn.value ? 'bg-canvas-overlay text-fg' : 'text-fg-muted hover:text-fg'
                }`}
              >
                {btn.icon} {btn.label}
              </button>
            ))}
          </div>

          {user && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={13} />}
              onClick={() => router.push(`/${username}/${repo}/pulls/new`)}
            >
              New pull request
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : prs.length === 0 ? (
          <EmptyState
            title={`No ${state} pull requests`}
            description={`There are no ${state} pull requests in this repository.`}
          />
        ) : (
          <div className="border border-border rounded-md divide-y divide-border">
            {prs.map((pr) => (
              <PRListItem key={pr.number} pr={pr} owner={username} repo={repo} />
            ))}
          </div>
        )}

        {total > limit && (
          <Pagination total={total} page={page} perPage={limit} onPageChange={setPage} />
        )}
      </div>
    </RepoLayout>
  );
}
