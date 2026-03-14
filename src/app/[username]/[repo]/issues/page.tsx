'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { CircleDot, Plus, Circle } from 'lucide-react';
import { LIST_ISSUES, GET_REPOSITORY } from '@/graphql/queries';
import { Repository, ListIssuesResponse } from '@/types';
import RepoLayout from '@/components/layout/RepoLayout';
import IssueListItem from '@/components/issues/IssueListItem';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import { useAuth } from '@/context/AuthContext';

export default function IssuesPage() {
  const { username, repo } = useParams<{ username: string; repo: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [state, setState] = useState<'open' | 'closed'>('open');
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data: repoData } = useQuery<{ getRepository: Repository }>(GET_REPOSITORY, {
    variables: { owner: username, name: repo },
  });
  const { data, loading } = useQuery<{ listIssues: ListIssuesResponse }>(LIST_ISSUES, {
    variables: { owner: username, repo, state, page, perPage: limit },
  });

  const issues = data?.listIssues.issues ?? [];
  const total = data?.listIssues.total ?? 0;

  return (
    <RepoLayout owner={username} repo={repo} repository={repoData?.getRepository}>
      <div className="space-y-3">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1 text-sm">
            <button
              onClick={() => { setState('open'); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium ${
                state === 'open' ? 'bg-canvas-overlay text-fg' : 'text-fg-muted hover:text-fg'
              }`}
            >
              <CircleDot size={14} className="text-success-fg" /> Open
            </button>
            <button
              onClick={() => { setState('closed'); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium ${
                state === 'closed' ? 'bg-canvas-overlay text-fg' : 'text-fg-muted hover:text-fg'
              }`}
            >
              <Circle size={14} className="text-fg-subtle" /> Closed
            </button>
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

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : issues.length === 0 ? (
          <EmptyState
            title={`No ${state} issues`}
            description={state === 'open' ? 'All issues are resolved!' : 'There are no closed issues yet.'}
          />
        ) : (
          <div className="border border-border rounded-md divide-y divide-border">
            {issues.map((issue) => (
              <IssueListItem
                key={issue.number}
                issue={issue}
                owner={username}
                repo={repo}
              />
            ))}
          </div>
        )}

        {total > limit && (
          <Pagination
            total={total}
            page={page}
            perPage={limit}
            onPageChange={setPage}
          />
        )}
      </div>
    </RepoLayout>
  );
}
