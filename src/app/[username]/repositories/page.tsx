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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link href={`/${username}`} className="flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg mb-6 w-fit">
          <ArrowLeft size={14} />
          Back to profile
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {user && (
            <Avatar src={user.avatarUrl} name={user.displayName || user.username} size={32} />
          )}
          <h1 className="text-xl font-semibold text-fg">
            {username}&apos;s repositories
          </h1>
        </div>

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
