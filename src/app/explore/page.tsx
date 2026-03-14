'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLazyQuery } from '@apollo/client';
import { Search, BookMarked, User as UserIcon } from 'lucide-react';
import { SEARCH_REPOSITORIES, SEARCH_USERS } from '@/graphql/queries';
import { ListReposResponse, ListUsersResponse } from '@/types';
import PageLayout from '@/components/layout/PageLayout';
import RepoCard from '@/components/repo/RepoCard';
import Pagination from '@/components/ui/Pagination';
import Spinner from '@/components/ui/Spinner';
import Avatar from '@/components/ui/Avatar';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Suspense } from 'react';

type Tab = 'repositories' | 'users';

export default function ExplorePage() {
  return (
    <Suspense fallback={<PageLayout><div className="flex justify-center py-12"><Spinner size="lg" /></div></PageLayout>}>
      <ExploreContent />
    </Suspense>
  );
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get('q') ?? '';
  const [q, setQ] = useState(initialQ);
  const [submitted, setSubmitted] = useState(initialQ);
  const [tab, setTab] = useState<Tab>('repositories');
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const [searchRepos, { data: repoData, loading: repoLoading }] = useLazyQuery<
    { searchRepositories: ListReposResponse }
  >(SEARCH_REPOSITORIES);

  const [searchUsers, { data: userData, loading: userLoading }] = useLazyQuery<
    { searchUsers: ListUsersResponse }
  >(SEARCH_USERS);

  const doSearch = (query: string, p = 1) => {
    if (!query.trim()) return;
    if (tab === 'repositories') {
      searchRepos({ variables: { query, page: p, perPage: PER_PAGE } });
    } else {
      searchUsers({ variables: { query, page: p, perPage: PER_PAGE } });
    }
  };

  useEffect(() => {
    if (submitted) doSearch(submitted, page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, submitted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSubmitted(q);
    router.replace(`/explore?q=${encodeURIComponent(q)}`);
    doSearch(q, 1);
  };

  const repos = repoData?.searchRepositories;
  const users = userData?.searchUsers;
  const loading = repoLoading || userLoading;

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative border-b border-border overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#cdd9e5 1px,transparent 1px),linear-gradient(90deg,#cdd9e5 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-0 right-0 w-[450px] h-[220px] bg-accent/10 rounded-full blur-3xl pointer-events-none glow-breathe" />
        <div className="relative max-w-4xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-black text-fg tracking-tight mb-1">Explore</h1>
          <p className="text-sm text-fg-muted mb-6">Discover public repositories and developers.</p>
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search repositories, users..."
                className="w-full pl-9 pr-3 py-2 bg-canvas border border-border rounded-md text-sm text-fg placeholder-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent-fg"
              />
            </div>
            <Button type="submit" variant="primary">Search</Button>
          </form>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex border-b border-border mb-6 gap-0">
          {(['repositories', 'users'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(1); doSearch(submitted, 1); }}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 transition-colors capitalize ${
                tab === t
                  ? 'border-accent-fg text-fg font-medium'
                  : 'border-transparent text-fg-muted hover:text-fg'
              }`}
            >
              {t === 'repositories' ? <BookMarked size={14} /> : <UserIcon size={14} />}
              {t}
              {t === 'repositories' && repos && (
                <span className="ml-1 px-1.5 py-0 text-xs bg-canvas-subtle border border-border rounded-full">
                  {repos.total}
                </span>
              )}
              {t === 'users' && users && (
                <span className="ml-1 px-1.5 py-0 text-xs bg-canvas-subtle border border-border rounded-full">
                  {users.total}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        )}

        {/* Repos */}
        {!loading && tab === 'repositories' && repos && (
          <div>
            {repos.repositories.length === 0 ? (
              <p className="text-fg-muted text-sm text-center py-8">No repositories found for &quot;{submitted}&quot;</p>
            ) : (
              <>
                <div className="border border-border rounded-md overflow-hidden mb-4">
                  {repos.repositories.map((r) => <RepoCard key={r.uuid} repo={r} showOwner />)}
                </div>
                <Pagination
                  page={page}
                  perPage={PER_PAGE}
                  total={repos.total}
                  onPageChange={(p) => { setPage(p); doSearch(submitted, p); }}
                />
              </>
            )}
          </div>
        )}

        {/* Users */}
        {!loading && tab === 'users' && users && (
          <div>
            {users.users.length === 0 ? (
              <p className="text-fg-muted text-sm text-center py-8">No users found for &quot;{submitted}&quot;</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {users.users.map((u) => (
                  <Link
                    key={u.uuid}
                    href={`/${u.username}`}
                    className="flex items-center gap-3 p-3 border border-border rounded-md hover:bg-canvas-subtle transition-colors"
                  >
                    <Avatar src={u.avatarUrl} name={u.displayName || u.username} size={40} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg truncate">{u.displayName || u.username}</p>
                      <p className="text-xs text-fg-muted truncate">{u.username}</p>
                      {u.bio && <p className="text-xs text-fg-muted truncate mt-0.5">{u.bio}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {!submitted && !loading && (
          <div className="text-center py-12">
            <Search size={40} className="text-fg-subtle mx-auto mb-4" />
            <p className="text-fg-muted">Search for repositories and users</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
