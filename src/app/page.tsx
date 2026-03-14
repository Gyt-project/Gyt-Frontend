'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { Code2, GitBranch, Star, GitPullRequest, CircleDot, Users, BookMarked, ArrowRight, Terminal, GitFork, Lock, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LIST_USER_REPOSITORIES, LIST_STARRED_REPOSITORIES } from '@/graphql/queries';
import PageLayout from '@/components/layout/PageLayout';
import RepoCard from '@/components/repo/RepoCard';
import Spinner from '@/components/ui/Spinner';
import { ListReposResponse } from '@/types';

function Dashboard({ username }: { username: string }) {
  const { data: reposData, loading: reposLoading } = useQuery<
    { listUserRepositories: ListReposResponse }
  >(LIST_USER_REPOSITORIES, { variables: { username, perPage: 5 } });

  const { data: starredData } = useQuery<
    { listStarredRepositories: ListReposResponse }
  >(LIST_STARRED_REPOSITORIES, { variables: { username, perPage: 5 } });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent repos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-fg">Your Repositories</h2>
            <Link href={`/${username}`} className="text-xs text-accent-fg hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="border border-border rounded-md overflow-hidden">
            {reposLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : reposData?.listUserRepositories.repositories.length === 0 ? (
              <div className="p-8 text-center text-fg-muted text-sm">
                No repositories yet.{' '}
                <Link href="/new" className="text-accent-fg hover:underline">Create one</Link>
              </div>
            ) : (
              reposData?.listUserRepositories.repositories.map((repo) => (
                <RepoCard key={repo.uuid} repo={repo} />
              ))
            )}
          </div>

          <div className="flex items-center justify-between mt-6">
            <h2 className="text-base font-semibold text-fg">Starred Repositories</h2>
            <Link href={`/${username}?tab=starred`} className="text-xs text-accent-fg hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="border border-border rounded-md overflow-hidden">
            {starredData?.listStarredRepositories.repositories.length === 0 ? (
              <div className="p-8 text-center text-fg-muted text-sm">You haven&apos;t starred any repositories yet.</div>
            ) : (
              starredData?.listStarredRepositories.repositories.map((repo) => (
                <RepoCard key={repo.uuid} repo={repo} showOwner />
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="border border-border rounded-md overflow-hidden">
            <div className="px-4 py-3 bg-canvas-subtle border-b border-border">
              <h3 className="text-sm font-semibold text-fg">Quick Actions</h3>
            </div>
            <div className="p-3 space-y-1">
              {[
                { href: '/new', icon: <BookMarked size={14} />, label: 'New repository' },
                { href: '/orgs/new', icon: <Users size={14} />, label: 'New organization' },
                { href: '/explore', icon: <Code2 size={14} />, label: 'Explore repositories' },
                { href: '/settings/ssh-keys', icon: <GitBranch size={14} />, label: 'Manage SSH keys' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 px-2 py-1.5 text-sm text-fg-muted hover:text-fg hover:bg-canvas-subtle rounded transition-colors"
                >
                  <span className="text-accent-fg">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="bg-canvas text-fg">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative border-b border-border overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#cdd9e5 1px,transparent 1px),linear-gradient(90deg,#cdd9e5 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Accent glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/10 rounded-full blur-3xl pointer-events-none glow-breathe" />

        <div className="relative max-w-5xl mx-auto px-6 py-28 flex flex-col items-start gap-8">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 border border-border bg-canvas-subtle rounded-full px-3 py-1 text-xs text-fg-muted font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-success-fg animate-pulse" />
            Self-hosted · Open platform
          </div>

          {/* Headline */}
          <div className="space-y-3 max-w-3xl">
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-fg leading-[1.05]">
              Where code<br />
              <span className="text-accent-fg">lives and ships.</span>
            </h1>
            <p className="text-lg text-fg-muted leading-relaxed max-w-xl">
              Ygit is a self-hosted Git platform. Manage repositories, review code,
              track issues, and collaborate — without giving your code away.
            </p>
          </div>

          {/* CTA row */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-emphasis text-white font-semibold rounded-md text-sm transition-colors"
            >
              Get started free <ArrowRight size={14} />
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-border hover:border-fg-muted text-fg-muted hover:text-fg font-semibold rounded-md text-sm transition-colors"
            >
              Browse repositories
            </Link>
          </div>

          {/* Terminal snippet */}
          <div className="w-full max-w-lg bg-canvas-inset border border-border rounded-xl overflow-hidden shadow-xl mt-2">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-canvas-subtle">
              <span className="w-3 h-3 rounded-full bg-danger/60" />
              <span className="w-3 h-3 rounded-full bg-warning/60" />
              <span className="w-3 h-3 rounded-full bg-success/60" />
              <span className="ml-2 text-xs text-fg-muted font-mono">bash</span>
            </div>
            <div className="px-5 py-4 font-mono text-sm leading-7 text-fg-muted">
              <p><span className="text-success-fg">$</span> git remote add origin git@ygit.lucamorgado.com/you/project.git</p>
              <p><span className="text-success-fg">$</span> git push -u origin main</p>
              <p className="text-fg-muted/50">Enumerating objects: 4, done.</p>
              <p className="text-accent-fg">To git@ygit.lucamorgado.com/you/project.git</p>
              <p className="text-success-fg"> * [new branch] &nbsp;&nbsp;main -&gt; main</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature grid ─────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden border border-border">
          {[
            {
              icon: <GitBranch size={18} />,
              title: 'Full Git hosting',
              body: 'Push, pull, branch, tag. Every standard Git operation works exactly as expected.',
            },
            {
              icon: <CircleDot size={18} />,
              title: 'Issues',
              body: 'Track bugs and feature requests with labels, assignees, and threaded comments.',
            },
            {
              icon: <GitPullRequest size={18} />,
              title: 'Pull requests',
              body: 'Propose changes, request reviews, and merge with confidence using a familiar workflow.',
            },
            {
              icon: <Users size={18} />,
              title: 'Organizations',
              body: 'Group people and repositories under an organization for team collaboration.',
            },
            {
              icon: <Lock size={18} />,
              title: 'Private repos',
              body: 'Keep sensitive code private. You control who can read or write to each repository.',
            },
            {
              icon: <Zap size={18} />,
              title: 'SSH & HTTPS',
              body: 'Connect via SSH keys or HTTPS tokens — whatever fits your workflow.',
            },
          ].map((f) => (
            <div key={f.title} className="bg-canvas-subtle p-6 space-y-2 hover:bg-canvas-overlay transition-colors">
              <div className="text-accent-fg">{f.icon}</div>
              <h3 className="font-semibold text-fg text-sm">{f.title}</h3>
              <p className="text-xs text-fg-muted leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-16 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-sm text-fg-muted font-mono mb-1">// ready when you are</p>
            <h2 className="text-2xl font-bold text-fg">Start hosting your code today.</h2>
          </div>
          <Link
            href="/register"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-emphasis text-white font-semibold rounded-md text-sm transition-colors"
          >
            Create an account <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {user ? <Dashboard username={user.username} /> : <LandingPage />}
    </PageLayout>
  );
}
