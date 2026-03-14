'use client';

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { MapPin, Mail, Clock, Building2, Star } from 'lucide-react';
import { GET_USER, LIST_USER_REPOSITORIES, LIST_STARRED_REPOSITORIES, LIST_USER_ORGANIZATIONS, GET_REPOSITORY, GET_DEFAULT_BRANCH, GET_FILE_BLOB } from '@/graphql/queries';
import { User, ListReposResponse, ListOrgsResponse, Repository, DefaultBranchResponse, FileBlob } from '@/types';
import { b64Decode } from '@/lib/utils';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { BookOpen } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import Avatar from '@/components/ui/Avatar';
import RepoCard from '@/components/repo/RepoCard';
import Spinner from '@/components/ui/Spinner';
import Pagination from '@/components/ui/Pagination';
import { formatDate } from '@/lib/utils';
import { clsx } from 'clsx';
import { Suspense } from 'react';

type Tab = 'repos' | 'starred' | 'orgs';

export default function UserProfilePage() {
  return (
    <Suspense fallback={<PageLayout><div className="flex justify-center py-12"><Spinner size="lg" /></div></PageLayout>}>
      <UserProfileContent />
    </Suspense>
  );
}

function UserProfileContent() {
  const params = useParams<{ username: string }>();
  const searchParams = useSearchParams();
  const username = params.username;
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) ?? 'repos');
  const [page, setPage] = useState(1);

  const { data: userData, loading: userLoading } = useQuery<{ getUser: User }>(GET_USER, {
    variables: { username },
  });

  const { data: reposData, loading: reposLoading } = useQuery<
    { listUserRepositories: ListReposResponse }
  >(LIST_USER_REPOSITORIES, {
    variables: { username, page, perPage: 20 },
    skip: tab !== 'repos',
  });

  const { data: starredData, loading: starredLoading } = useQuery<
    { listStarredRepositories: ListReposResponse }
  >(LIST_STARRED_REPOSITORIES, {
    variables: { username, page, perPage: 20 },
    skip: tab !== 'starred',
  });

  const { data: orgsData } = useQuery<{ listUserOrganizations: ListOrgsResponse }>(
    LIST_USER_ORGANIZATIONS,
    { variables: { username } }
  );

  const { data: profileRepoData } = useQuery<{ getRepository: Repository }>(GET_REPOSITORY, {
    variables: { owner: username, name: username },
    errorPolicy: 'ignore',
    context: { skipNotFoundRedirect: true },
  });
  const profileRepo = profileRepoData?.getRepository;

  const { data: profileBranchData } = useQuery<{ getDefaultBranch: DefaultBranchResponse }>(
    GET_DEFAULT_BRANCH,
    {
      variables: { owner: username, name: username },
      skip: !profileRepo,
      errorPolicy: 'ignore',
      context: { skipNotFoundRedirect: true },
    }
  );
  const profileBranch = profileBranchData?.getDefaultBranch?.branchName;

  const { data: profileReadmeData } = useQuery<{ getFileBlob: FileBlob }>(GET_FILE_BLOB, {
    variables: { owner: username, name: username, path: 'README.md', ref: profileBranch },
    skip: !profileBranch,
    errorPolicy: 'ignore',
    context: { skipNotFoundRedirect: true },
  });
  const profileReadme = profileReadmeData?.getFileBlob;

  if (userLoading) {
    return (
      <PageLayout>
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      </PageLayout>
    );
  }

  const user = userData?.getUser;
  if (!user) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-fg-muted">User not found.</p>
        </div>
      </PageLayout>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'repos', label: 'Repositories' },
    { key: 'starred', label: 'Starred' },
    { key: 'orgs', label: 'Organizations' },
  ];

  const repos = tab === 'repos' ? reposData?.listUserRepositories : starredData?.listStarredRepositories;
  const loading = reposLoading || starredLoading;

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <Avatar
              src={user.avatarUrl}
              name={user.displayName || user.username}
              size={256}
              className="w-full rounded-full mb-4 border-4 border-border"
            />
            <h1 className="text-xl font-bold text-fg">{user.displayName || user.username}</h1>
            <p className="text-base text-fg-muted mb-2">@{user.username}</p>
            {user.bio && <p className="text-sm text-fg mb-4">{user.bio}</p>}

            <div className="space-y-1 text-sm text-fg-muted">
              {user.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} /> {user.email}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock size={14} /> Joined {formatDate(user.createdAt)}
              </div>
            </div>

            {/* Orgs */}
            {(orgsData?.listUserOrganizations.organizations?.length ?? 0) > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2">Organizations</p>
                <div className="flex flex-wrap gap-1.5">
                  {orgsData?.listUserOrganizations.organizations.map((org) => (
                    <Link key={org.uuid} href={`/orgs/${org.name}`} title={org.displayName || org.name}>
                      <Avatar src={org.avatarUrl} name={org.displayName || org.name} size={32} />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">
            {/* Profile README */}
            {profileReadme && !profileReadme.isBinary && (
              <div className="border border-border rounded-md overflow-hidden mb-6">
                <div className="px-4 py-2.5 bg-canvas-subtle border-b border-border flex items-center gap-2">
                  <BookOpen size={14} className="text-fg-muted" />
                  <span className="text-sm font-medium text-fg">{username} / {username}</span>
                </div>
                <div className="px-6 py-5">
                  <MarkdownRenderer>{b64Decode(profileReadme.content)}</MarkdownRenderer>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-border mb-6">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setPage(1); }}
                  className={clsx(
                    'px-4 py-2 text-sm border-b-2 transition-colors',
                    tab === t.key
                      ? 'border-accent-fg text-fg font-medium'
                      : 'border-transparent text-fg-muted hover:text-fg'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {loading && <div className="flex justify-center py-8"><Spinner /></div>}

            {!loading && tab !== 'orgs' && repos && (
              <>
                {repos.repositories.length === 0 ? (
                  <p className="text-fg-muted text-sm text-center py-8">No repositories to show.</p>
                ) : (
                  <div className="border border-border rounded-md overflow-hidden">
                    {repos.repositories.map((r) => (
                      <RepoCard key={r.uuid} repo={r} showOwner={tab === 'starred'} />
                    ))}
                  </div>
                )}
                <Pagination
                  page={page}
                  perPage={20}
                  total={repos.total}
                  onPageChange={(p) => setPage(p)}
                />
              </>
            )}

            {tab === 'orgs' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {orgsData?.listUserOrganizations.organizations.map((org) => (
                  <Link
                    key={org.uuid}
                    href={`/orgs/${org.name}`}
                    className="flex items-center gap-3 p-3 border border-border rounded-md hover:bg-canvas-subtle transition-colors"
                  >
                    <Avatar src={org.avatarUrl} name={org.displayName || org.name} size={40} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-fg truncate">{org.displayName || org.name}</p>
                      <p className="text-xs text-fg-muted">{org.memberCount} members · {org.repoCount} repos</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </PageLayout>
  );
}
