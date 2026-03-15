'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { CircleDot, CheckCircle2, Plus, Search } from 'lucide-react';
import { LIST_ISSUES, GET_REPOSITORY } from '@/graphql/queries';
import { Repository, ListIssuesResponse } from '@/types';
import RepoLayout from '@/components/layout/RepoLayout';
import IssueListItem from '@/components/issues/IssueListItem';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { useAuth } from '@/context/AuthContext';

export default function IssuesPage() {
  const { username, repo } = useParams<{ username: string; repo: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [state, setState] = useState<'open' | 'closed'>('open');
  const [authorFilter, setAuthorFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data: repoData } = useQuery<{ getRepository: Repository }>(GET_REPOSITORY, {
    variables: { owner: username, name: repo },
  });

  const { data, loading } = useQuery<{ listIssues: ListIssuesResponse }>(LIST_ISSUES, {
    variables: {
      owner: username, repo, state, page, perPage: limit,
      author: authorFilter || undefined,
    },
  });

  const { data: openData } = useQuery<{ listIssues: ListIssuesResponse }>(LIST_ISSUES, {
    variables: { owner: username, repo, state: 'open', page: 1, perPage: 1 },
  });
  const { data: closedData } = useQuery<{ listIssues: ListIssuesResponse }>(LIST_ISSUES, {
    variables: { owner: username, repo, state: 'closed', page: 1, perPage: 1 },
  });

  const issues = data?.listIssues.issues ?? [];
  const total = data?.listIssues.total ?? 0;
  const openCount = openData?.listIssues.total ?? 0;
  const closedCount = closedData?.listIssues.total ?? 0;

  function switchState(s: 'open' | 'closed') {
    setState(s);
    setPage(1);
  }

  return (
    <RepoLayout owner={username} repo={repo} repository={repoData?.getRepository}>
      <div className="space-y-3">
        {/* Filter bar */}
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
              onClick={() => router.push(`/${username}/${repo}/issues/new`)}
            >
              New issue
            </Button>
          )}
        </div>

        {/* List container */}
        <div className="border border-border rounded-md overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4 px-4 py-2.5 bg-canvas-subtle border-b border-border text-sm">
            <button
              onClick={() => switchState('open')}
              className={`flex items-center gap-1.5 transition-colors ${
                state === 'open' ? 'font-semibold text-fg' : 'text-fg-muted hover:text-fg'
              }`}
            >
              <CircleDot size={15} />
              <span><strong>{openCount}</strong> Open</span>
            </button>
            <button
              onClick={() => switchState('closed')}
              className={`flex items-center gap-1.5 transition-colors ${
                state === 'closed' ? 'font-semibold text-fg' : 'text-fg-muted hover:text-fg'
              }`}
            >
              <CheckCircle2 size={15} />
              <span><strong>{closedCount}</strong> Closed</span>
            </button>
          </div>

          {/* Items */}
          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : issues.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-fg-muted gap-2">
              {state === 'open'
                ? <><CircleDot size={24} className="text-success-fg/50" /><p className="text-sm">No open issues</p></>
                : <><CheckCircle2 size={24} className="text-fg-subtle" /><p className="text-sm">No closed issues</p></>
              }
            </div>
          ) : (
            <div className="divide-y divide-border">
              {issues.map((issue) => (
                <IssueListItem key={issue.number} issue={issue} owner={username} repo={repo} />
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
