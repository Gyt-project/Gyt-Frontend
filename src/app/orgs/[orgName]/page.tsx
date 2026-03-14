'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { Clock, Users, BookMarked } from 'lucide-react';
import { GET_ORGANIZATION, LIST_ORG_REPOSITORIES, LIST_ORG_MEMBERS } from '@/graphql/queries';
import { Organization, ListReposResponse, ListOrgMembersResponse } from '@/types';
import PageLayout from '@/components/layout/PageLayout';
import Avatar from '@/components/ui/Avatar';
import RepoCard from '@/components/repo/RepoCard';
import Spinner from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import { clsx } from 'clsx';
import { useState } from 'react';

type Tab = 'repos' | 'members';

export default function OrgProfilePage() {
  const { orgName } = useParams<{ orgName: string }>();
  const [tab, setTab] = useState<Tab>('repos');

  const { data: orgData, loading: orgLoading } = useQuery<{ getOrganization: Organization }>(
    GET_ORGANIZATION, { variables: { name: orgName } }
  );

  const { data: reposData, loading: reposLoading } = useQuery<
    { listOrgRepositories: ListReposResponse }
  >(LIST_ORG_REPOSITORIES, {
    variables: { orgName, perPage: 20 },
    skip: tab !== 'repos',
  });

  const { data: membersData, loading: membersLoading } = useQuery<
    { listOrgMembers: ListOrgMembersResponse }
  >(LIST_ORG_MEMBERS, {
    variables: { orgName },
    skip: tab !== 'members',
  });

  if (orgLoading) {
    return <PageLayout><div className="flex justify-center py-16"><Spinner size="lg" /></div></PageLayout>;
  }

  const org = orgData?.getOrganization;
  if (!org) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-fg-muted">Organization not found.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <Avatar src={org.avatarUrl} name={org.displayName || org.name} size={200} className="w-full rounded-lg mb-4 border border-border" />
            <h1 className="text-xl font-bold text-fg">{org.displayName || org.name}</h1>
            <p className="text-base text-fg-muted mb-2">@{org.name}</p>
            {org.description && <p className="text-sm text-fg mb-3">{org.description}</p>}
            <div className="space-y-1 text-sm text-fg-muted">
              <div className="flex items-center gap-2"><Users size={14} /> {org.memberCount} members</div>
              <div className="flex items-center gap-2"><BookMarked size={14} /> {org.repoCount} repositories</div>
              <div className="flex items-center gap-2"><Clock size={14} /> Created {formatDate(org.createdAt)}</div>
            </div>
            <Link
              href={`/orgs/${orgName}/settings`}
              className="mt-4 block text-center px-3 py-1.5 border border-border rounded-md text-sm text-fg hover:bg-canvas-subtle transition-colors"
            >
              Organization settings
            </Link>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">
            <div className="flex border-b border-border mb-6">
              {(['repos', 'members'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={clsx(
                    'px-4 py-2 text-sm border-b-2 transition-colors capitalize',
                    tab === t ? 'border-accent-fg text-fg font-medium' : 'border-transparent text-fg-muted hover:text-fg'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {(reposLoading || membersLoading) && <div className="flex justify-center py-8"><Spinner /></div>}

            {tab === 'repos' && !reposLoading && (
              <div className="border border-border rounded-md overflow-hidden">
                {reposData?.listOrgRepositories.repositories.map((r) => (
                  <RepoCard key={r.uuid} repo={r} />
                ))}
                {reposData?.listOrgRepositories.repositories.length === 0 && (
                  <p className="text-fg-muted text-sm text-center py-8">No repositories yet.</p>
                )}
              </div>
            )}

            {tab === 'members' && !membersLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {membersData?.listOrgMembers.members.map((m) => (
                  <Link
                    key={m.user.uuid}
                    href={`/${m.user.username}`}
                    className="flex items-center gap-3 p-3 border border-border rounded-md hover:bg-canvas-subtle transition-colors"
                  >
                    <Avatar src={m.user.avatarUrl} name={m.user.displayName || m.user.username} size={40} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-fg truncate">{m.user.displayName || m.user.username}</p>
                      <p className="text-xs text-fg-muted">@{m.user.username} · {m.role}</p>
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
