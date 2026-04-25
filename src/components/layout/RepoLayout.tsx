'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { clsx } from 'clsx';
import {
  Code2, GitCommitHorizontal, GitBranch, Tag,
  CircleDot, GitPullRequest, Settings, BookMarked, Tags,
} from 'lucide-react';
import PageLayout from './PageLayout';
import { Repository } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface RepoLayoutProps {
  owner: string;
  repo: string;
  repository?: Repository;
  children: ReactNode;
}

const baseTabs = [
  { label: 'Code', href: '', icon: <Code2 size={14} /> },
  { label: 'Issues', href: '/issues', icon: <CircleDot size={14} /> },
  { label: 'Pull Requests', href: '/pulls', icon: <GitPullRequest size={14} /> },
  { label: 'Commits', href: '/commits', icon: <GitCommitHorizontal size={14} /> },
  { label: 'Branches', href: '/branches', icon: <GitBranch size={14} /> },
  { label: 'Tags', href: '/tags', icon: <Tag size={14} /> },
  { label: 'Labels', href: '/labels', icon: <Tags size={14} /> },
];

export default function RepoLayout({ owner, repo, repository, children }: RepoLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const base = `/${owner}/${repo}`;

  const tabs = user?.username === owner
    ? [...baseTabs, { label: 'Settings', href: '/settings', icon: <Settings size={14} /> }]
    : baseTabs;

  return (
    <PageLayout>
      {/* Repo Header */}
      <div className="border-b border-border bg-canvas-subtle">
        <div className="max-w-7xl mx-auto px-4 pt-4 pb-0">
          <div className="flex items-center gap-2 text-sm mb-4">
            <BookMarked size={16} className="text-fg-muted" />
            <Link href={`/${owner}`} className="text-accent-fg hover:underline font-medium">
              {owner}
            </Link>
            <span className="text-fg-muted">/</span>
            <Link href={base} className="text-accent-fg hover:underline font-bold">
              {repo}
            </Link>
            {repository?.isPrivate && (
              <span className="ml-1 px-1.5 py-0 text-xs border border-border rounded-full text-fg-muted">
                Private
              </span>
            )}
          </div>

          {repository?.description && (
            <p className="text-sm text-fg-muted mb-4">{repository.description}</p>
          )}

          {/* Tabs */}
          <nav className="flex overflow-x-auto -mb-px gap-0">
            {tabs.map((tab) => {
              const href = `${base}${tab.href}`;
              const isActive =
                tab.href === ''
                  ? pathname === base
                  : pathname.startsWith(href);
              return (
                <Link
                  key={tab.label}
                  href={href}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors',
                    isActive
                      ? 'border-accent-fg text-fg font-medium'
                      : 'border-transparent text-fg-muted hover:text-fg hover:border-border'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6 w-full">{children}</div>
    </PageLayout>
  );
}
