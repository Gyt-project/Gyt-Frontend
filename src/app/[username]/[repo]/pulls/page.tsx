'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { GitPullRequest, GitMerge, XCircle, Plus, Search, CheckCircle2, X, Tag } from 'lucide-react';
import { LIST_PULL_REQUESTS, GET_REPOSITORY } from '@/graphql/queries';
import { Repository, ListPRsResponse } from '@/types';
import RepoLayout from '@/components/layout/RepoLayout';
import PRListItem from '@/components/pulls/PRListItem';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { useAuth } from '@/context/AuthContext';

export default function PullsPage() {
  const { username, repo } = useParams<{ username: string; repo: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [state, setState] = useState<'open' | 'closed' | 'merged'>('open');
  const [authorFilter, setAuthorFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 25;

  const labelFilter = searchParams.get('label') ?? '';

  const { data: repoData } = useQuery<{ getRepository: Repository }>(GET_REPOSITORY, {
    variables: { owner: username, name: repo },
  });

  const { data, loading } = useQuery<{ listPullRequests: ListPRsResponse }>(LIST_PULL_REQUESTS, {
    variables: {
      owner: username, repo, state, page, perPage: limit,
      author: authorFilter || undefined,
      label: labelFilter || undefined,
    },
  });

  const { data: openData } = useQuery<{ listPullRequests: ListPRsResponse }>(LIST_PULL_REQUESTS, {
    variables: { owner: username, repo, state: 'open', page: 1, perPage: 1 },
  });
  const { data: closedData } = useQuery<{ listPullRequests: ListPRsResponse }>(LIST_PULL_REQUESTS, {
    variables: { owner: username, repo, state: 'closed', page: 1, perPage: 1 },
  });

  const prs = data?.listPullRequests.pullRequests ?? [];
  const total = data?.listPullRequests.total ?? 0;
  const openCount = openData?.listPullRequests.total ?? 0;
  const closedCount = closedData?.listPullRequests.total ?? 0;

  function switchState(s: 'open' | 'closed' | 'merged') {
    setState(s);
    setPage(1);
  }

  const stateTab = (
    value: 'open' | 'closed' | 'merged',
    label: string,
    icon: React.ReactNode,
    count?: number,
  ) => (
    <button
      onClick={() => switchState(value)}
      className={`flex items-center gap-1.5 transition-colors ${
        state === value ? 'font-semibold text-fg' : 'text-fg-muted hover:text-fg'
      }`}
    >
      {icon}
      <span>
        {count !== undefined && <strong>{count}</strong>}{count !== undefined ? ' ' : ''}{label}
      </span>
    </button>
  );

  return (
    <RepoLayout owner={username} repo={repo} repository={repoData?.getRepository}>
      <div className="space-y-3">
        {/* Filter bar */}
        <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search by author…"
              value={authorFilter}
              onChange={(e) => { setAuthorFilter(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-canvas-overlay border border-border rounded-md text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent-fg/30 focus:border-accent-fg/50"
            />
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
        {labelFilter && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-fg-muted">
              <Tag size={12} />
              Filtered by label:
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-accent-subtle text-accent-fg border border-accent-muted">
              {labelFilter}
              <button
                onClick={() => router.push(`/${username}/${repo}/pulls`)}
                className="hover:text-danger-fg transition-colors"
                aria-label="Clear label filter"
              >
                <X size={11} />
              </button>
            </span>
          </div>
        )}
        </div>

        {/* List container */}
        <div className="border border-border rounded-md overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4 px-4 py-2.5 bg-canvas-subtle border-b border-border text-sm">
            {stateTab('open', 'Open', <GitPullRequest size={15} />, openCount)}
            {stateTab('closed', 'Closed', <XCircle size={15} />, closedCount)}
            {stateTab('merged', 'Merged', <GitMerge size={15} />)}
          </div>

          {/* Items */}
          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : prs.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-fg-muted gap-2">
              {state === 'open'
                ? <><GitPullRequest size={24} className="text-success-fg/50" /><p className="text-sm">No open pull requests</p></>
                : state === 'merged'
                ? <><GitMerge size={24} className="text-purple-fg/50" /><p className="text-sm">No merged pull requests</p></>
                : <><CheckCircle2 size={24} className="text-fg-subtle" /><p className="text-sm">No closed pull requests</p></>
              }
            </div>
          ) : (
            <div className="divide-y divide-border">
              {prs.map((pr) => (
                <PRListItem key={pr.number} pr={pr} owner={username} repo={repo} />
              ))}
            </div>
          )}
        </div>

        {total > limit && (
          <Pagination total={total} page={page} perPage={limit} onPageChange={setPage} />
        )}
      </div>
    </RepoLayout>
  );
}
