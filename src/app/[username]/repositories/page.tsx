'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { GET_USER, LIST_USER_REPOSITORIES } from '@/graphql/queries';
import { User, ListReposResponse } from '@/types';
import PageLayout from '@/components/layout/PageLayout';
import Avatar from '@/components/ui/Avatar';
import RepoCard from '@/components/repo/RepoCard';
import Spinner from '@/components/ui/Spinner';
import Pagination from '@/components/ui/Pagination';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';

export default function UserRepositoriesPage() {
  return (
    <Suspense fallback={<PageLayout><div className="flex justify-center py-12"><Spinner size="lg" /></div></PageLayout>}>
      <UserRepositoriesContent />
    </Suspense>
  );
}

function UserRepositoriesContent() {
  const { username } = useParams<{ username: string }>();
  const [page, setPage] = useState(1);

  const { data: userData } = useQuery<{ getUser: User }>(GET_USER, {
    variables: { username },
  });

  const { data: reposData, loading } = useQuery<{ listUserRepositories: ListReposResponse }>(
    LIST_USER_REPOSITORIES,
    { variables: { username, page, perPage: 30 } }
  );

  const user = userData?.getUser;
  const repos = reposData?.listUserRepositories;

  return (
    <PageLayout>
      {/* Page header */}
      <section className="relative border-b border-border overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#cdd9e5 1px,transparent 1px),linear-gradient(90deg,#cdd9e5 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-0 right-0 w-[450px] h-[180px] bg-accent/10 rounded-full blur-3xl pointer-events-none glow-breathe" />
        <div className="relative max-w-4xl mx-auto px-4 py-8">
          <Link href={`/${username}`} className="flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg mb-4 w-fit">
            <ArrowLeft size={13} />
            Back to profile
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              <Avatar src={user.avatarUrl} name={user.displayName || user.username} size={32} />
            )}
            <h1 className="text-2xl font-bold text-fg">
              {username}&apos;s repositories
            </h1>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        )}

        {!loading && repos && (
          <>
            {repos.repositories.length === 0 ? (
              <p className="text-fg-muted text-sm text-center py-12">No repositories yet.</p>
            ) : (
              <div className="border border-border rounded-md overflow-hidden">
                {repos.repositories.map((r) => (
                  <RepoCard key={r.uuid} repo={r} showOwner={false} />
                ))}
              </div>
            )}
            <Pagination
              page={page}
              perPage={30}
              total={repos.total}
              onPageChange={(p) => setPage(p)}
            />
          </>
        )}
      </div>
    </PageLayout>
  );
}
