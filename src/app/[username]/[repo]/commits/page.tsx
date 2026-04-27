'use client';

import { useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useLazyQuery } from '@apollo/client';
import { Search } from 'lucide-react';
import { LIST_COMMITS, GET_REPOSITORY, LIST_BRANCHES, SEARCH_COMMITS, GET_DEFAULT_BRANCH } from '@/graphql/queries';
import { ListCommitsResponse, Repository, ListBranchesResponse, DefaultBranchResponse } from '@/types';
import RepoLayout from '@/components/layout/RepoLayout';
import CommitItem from '@/components/repo/CommitItem';
import BranchSelector from '@/components/repo/BranchSelector';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { Suspense } from 'react';
import { useSSE } from '@/lib/useSSE';

export default function CommitsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Spinner size="lg" /></div>}>
      <CommitsContent />
    </Suspense>
  );
}

function CommitsContent() {
  const { username, repo } = useParams<{ username: string; repo: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [submitted, setSubmitted] = useState('');

  const { data: repoData } = useQuery<{ getRepository: Repository }>(GET_REPOSITORY, {
    variables: { owner: username, name: repo },
    context: { triggerNotFoundOn404: true },
  });
  const { data: branchData } = useQuery<{ getDefaultBranch: DefaultBranchResponse }>(GET_DEFAULT_BRANCH, {
    variables: { owner: username, name: repo },
  });
  const { data: branchesData } = useQuery<{ listBranches: ListBranchesResponse }>(LIST_BRANCHES, {
    variables: { owner: username, name: repo },
  });

  const urlRef = searchParams.get('ref');
  const defaultBranch = branchData?.getDefaultBranch?.branchName
    ?? branchesData?.listBranches.branches[0]?.name;
  const ref = urlRef ?? defaultBranch ?? 'master';
  const { data, loading, refetch: refetchCommits } = useQuery<{ listCommits: ListCommitsResponse }>(LIST_COMMITS, {
    variables: { owner: username, name: repo, ref, page, limit: 30 },
    skip: !!submitted || !defaultBranch,
  });
  const [searchCommits, { data: searchData, loading: searchLoading }] = useLazyQuery<
    { searchCommits: ListCommitsResponse }
  >(SEARCH_COMMITS);

  // Live-refresh commit list when a push is detected on the current branch.
  const sseWsPath = username && repo ? `/ws/repo/${username}/${repo}` : null;
  const handlePush = useCallback(() => { if (!submitted) refetchCommits(); }, [submitted, refetchCommits]);
  useSSE(sseWsPath, (type) => { if (type === 'push') handlePush(); });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(search);
    if (search.trim()) {
      searchCommits({ variables: { owner: username, name: repo, query: search, ref } });
    }
  };

  const commits = submitted
    ? searchData?.searchCommits.commits
    : data?.listCommits.commits;
  const isLoading = loading || searchLoading;

  return (
    <RepoLayout owner={username} repo={repo} repository={repoData?.getRepository}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {branchesData && (
              <BranchSelector
                branches={branchesData.listBranches.branches}
                currentBranch={ref}
                owner={username}
                repo={repo}
                onSelect={(branch) => router.push(`/${username}/${repo}/commits?ref=${branch}`)}
              />
            )}
            <span className="text-sm text-fg-muted">Commit history</span>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search commits…"
                className="pl-8 pr-3 py-1.5 text-sm bg-canvas-subtle border border-border rounded-md text-fg placeholder-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent w-48"
              />
            </div>
            <Button type="submit" size="sm">Search</Button>
            {submitted && (
              <Button size="sm" onClick={() => { setSubmitted(''); setSearch(''); }}>Clear</Button>
            )}
          </form>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : !commits?.length ? (
          <EmptyState title="No commits found" />
        ) : (
          <div className="border border-border rounded-md overflow-hidden">
            {commits.map((c) => (
              <CommitItem key={c.sha} commit={c} owner={username} repo={repo} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!submitted && data?.listCommits && (
          <div className="flex justify-between items-center pt-2">
            <Button
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Newer
            </Button>
            <span className="text-sm text-fg-muted">Page {page}</span>
            <Button
              size="sm"
              disabled={!data.listCommits.hasMore}
              onClick={() => setPage((p) => p + 1)}
            >
              Older →
            </Button>
          </div>
        )}
      </div>
    </RepoLayout>
  );
}
