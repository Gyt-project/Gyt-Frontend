'use client';

import { useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation } from '@apollo/client';
import Link from 'next/link';
import { Star, GitFork, Eye, Clock, Terminal, Copy, Check, RotateCw, X } from 'lucide-react';
import {
  GET_REPOSITORY, GET_REPO_TREE, GET_DEFAULT_BRANCH,
  GET_CLONE_URLS, GET_REPO_STATS, CHECK_STAR, LIST_BRANCHES,
  GET_FILE_BLOB,
} from '@/graphql/queries';
import { STAR_REPOSITORY, UNSTAR_REPOSITORY } from '@/graphql/mutations';
import {
  Repository, RepoTreeResponse, DefaultBranchResponse,
  CloneURLs, RepoStats, CheckStarResponse, ListBranchesResponse, FileBlob,
} from '@/types';
import RepoLayout from '@/components/layout/RepoLayout';
import FileTree from '@/components/repo/FileTree';
import RepoSidebar from '@/components/repo/RepoSidebar';
import CodeViewer from '@/components/repo/CodeViewer';
import BranchSelector from '@/components/repo/BranchSelector';
import CloneButton from '@/components/repo/CloneButton';
import { useSSE } from '@/lib/useSSE';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { formatBytes, b64Decode } from '@/lib/utils';
import { Suspense } from 'react';

export default function RepoPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Spinner size="lg" /></div>}>
      <RepoContent />
    </Suspense>
  );
}

// â”€â”€ Empty repo quick-setup panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);
  return (
    <button onClick={copy} className="text-fg-muted hover:text-fg transition-colors" title="Copy">
      {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
    </button>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="relative group bg-canvas-subtle rounded border border-border px-3 py-2 font-mono text-xs text-fg leading-5 whitespace-pre">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={children} />
      </div>
      {children}
    </div>
  );
}

function EmptyRepoSetup({ owner, repo, cloneUrls }: { owner: string; repo: string; cloneUrls?: CloneURLs }) {
  const [cloneTab, setCloneTab] = useState<'https' | 'ssh'>('https');
  const cloneUrl = cloneTab === 'ssh' ? (cloneUrls?.sshUrl ?? '') : (cloneUrls?.httpUrl ?? '');
  const repoUrl = cloneUrls?.httpUrl ?? `http://localhost:8080/${owner}/${repo}.git`;

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* Quick setup */}
      <div className="border border-border rounded-md overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-canvas-subtle border-b border-border">
          <Terminal size={14} className="text-fg-muted" />
          <span className="text-sm font-semibold text-fg">Quick setup</span>
          <span className="text-xs text-fg-muted ml-1">-- if you&apos;ve done this kind of thing before</span>
        </div>
        <div className="p-4 space-y-3">
          {/* Protocol selector */}
          {cloneUrls && (
            <div className="flex items-center gap-2">
              <div className="flex rounded border border-border overflow-hidden text-xs">
                {(['https', 'ssh'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setCloneTab(t)}
                    className={`px-3 py-1 uppercase font-medium transition-colors ${
                      cloneTab === t
                        ? 'bg-accent text-white'
                        : 'bg-canvas-subtle text-fg-muted hover:text-fg'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex-1 flex items-center gap-2 border border-border rounded px-3 py-1.5 bg-canvas text-xs font-mono text-fg">
                <span className="flex-1 truncate">{cloneUrl}</span>
                <CopyButton text={cloneUrl} />
              </div>
            </div>
          )}
          <p className="text-xs text-fg-muted">
            Get started by creating a new file or uploading an existing file. We recommend every repository include a{' '}
            <strong className="text-fg">README</strong>,{' '}
            <strong className="text-fg">.gitignore</strong>, and a{' '}
            <strong className="text-fg">LICENSE</strong>.
          </p>
        </div>
      </div>

      {/* Create new repo */}
      <div>
        <h3 className="text-sm font-semibold text-fg mb-2">
          ...or create a new repository on the command line
        </h3>
        <CodeBlock>{`echo "# ${repo}" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin ${repoUrl}
git push -u origin main`}
        </CodeBlock>
      </div>

      {/* Push existing */}
      <div>
        <h3 className="text-sm font-semibold text-fg mb-2">
          ...or push an existing repository from the command line
        </h3>
        <CodeBlock>{`git remote add origin ${repoUrl}
git branch -M main
git push -u origin main`}
        </CodeBlock>
      </div>

      {/* Import */}
      <div>
        <h3 className="text-sm font-semibold text-fg mb-2">
          ...or import code from another repository
        </h3>
        <p className="text-xs text-fg-muted">
          You can initialize this repository with code from an existing repository. Start the import from the command line using <code className="bg-canvas-subtle px-1 py-0.5 rounded border border-border">git clone --bare</code> and then push with <code className="bg-canvas-subtle px-1 py-0.5 rounded border border-border">git push --mirror</code>.
        </p>
      </div>
    </div>
  );
}

// â”€â”€ Main content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function RepoContent() {
  const { username, repo } = useParams<{ username: string; repo: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const path = searchParams.get('path') ?? '';

  const { data: repoData, loading: repoLoading, refetch: refetchRepo } = useQuery<{ getRepository: Repository }>(
    GET_REPOSITORY, { variables: { owner: username, name: repo }, context: { triggerNotFoundOn404: true } }
  );

  const { data: branchData, refetch: refetchDefaultBranch } = useQuery<{ getDefaultBranch: DefaultBranchResponse }>(
    GET_DEFAULT_BRANCH, {
      variables: { owner: username, name: repo },
    }
  );

  const { data: branchesData, loading: branchesLoading, refetch: refetchBranches } = useQuery<{ listBranches: ListBranchesResponse }>(
    LIST_BRANCHES, {
      variables: { owner: username, name: repo },
    }
  );

  const hasNoBranches = !branchesLoading && (branchesData?.listBranches.branches.length ?? 1) === 0;

  const ref = searchParams.get('ref')
    ?? branchData?.getDefaultBranch.branchName
    ?? branchesData?.listBranches.branches[0]?.name
    ?? '';

  const { data: treeData, loading: treeLoading, refetch: refetchTree } = useQuery<{ getRepositoryTree: RepoTreeResponse }>(
    GET_REPO_TREE, {
      variables: { owner: username, name: repo, ref, path: path || undefined },
      skip: hasNoBranches || !ref,
    }
  );

  const { data: cloneData } = useQuery<{ getCloneURLs: CloneURLs }>(
    GET_CLONE_URLS, { variables: { owner: username, name: repo } }
  );

  const { data: statsData, refetch: refetchStats } = useQuery<{ getRepositoryStats: RepoStats }>(
    GET_REPO_STATS, {
      variables: { owner: username, name: repo },
    }
  );

  const { data: starData, refetch: refetchStar } = useQuery<{ checkStar: CheckStarResponse }>(
    CHECK_STAR, { variables: { owner: username, name: repo }, skip: !user }
  );

  const readmeEntry = treeData?.getRepositoryTree.entries.find(
    (e) => !e.isDir && /^readme(\.md)?$/i.test(e.name)
  );

  const { data: readmeData, refetch: refetchReadme } = useQuery<{ getFileBlob: FileBlob }>(
    GET_FILE_BLOB,
    {
      variables: { owner: username, name: repo, path: readmeEntry?.path, ref },
      skip: !readmeEntry,
    }
  );

  const [starRepo, { loading: starring }] = useMutation(STAR_REPOSITORY, {
    update(cache) {
      cache.updateQuery(
        { query: GET_REPOSITORY, variables: { owner: username, name: repo } },
        (data) => data
          ? { getRepository: { ...data.getRepository, stars: data.getRepository.stars + 1 } }
          : data
      );
    },
    onCompleted: () => refetchStar(),
  });

  const [unstarRepo, { loading: unstarring }] = useMutation(UNSTAR_REPOSITORY, {
    update(cache) {
      cache.updateQuery(
        { query: GET_REPOSITORY, variables: { owner: username, name: repo } },
        (data) => data
          ? { getRepository: { ...data.getRepository, stars: Math.max(0, data.getRepository.stars - 1) } }
          : data
      );
    },
    onCompleted: () => refetchStar(),
  });

  const repository = repoData?.getRepository;
  const isStarred = starData?.checkStar.starred ?? false;
  const stats = statsData?.getRepositoryStats;

  const toggleStar = () => {
    if (!user) { router.push('/login'); return; }
    if (isStarred) {
      unstarRepo({ variables: { owner: username, name: repo } });
    } else {
      starRepo({ variables: { owner: username, name: repo } });
    }
  };

  // ── SSE: push events ──────────────────────────────────────────────────────
  const [pushBanner, setPushBanner] = useState(false);
  const handlePush = useCallback(() => {
    // Silently refresh all data so the UI reflects the new state immediately.
    refetchBranches();
    refetchDefaultBranch();
    refetchTree();
    refetchStats();
    refetchRepo();
    refetchReadme();
    setPushBanner(true);
  }, [refetchBranches, refetchDefaultBranch, refetchTree, refetchStats, refetchRepo, refetchReadme]);
  const ssePushPath = username && repo ? `/ws/repo/${username}/${repo}` : null;
  useSSE(ssePushPath, (type) => { if (type === 'push') handlePush(); });

  return (
    <RepoLayout owner={username} repo={repo} repository={repository}>
      {/* New commits banner */}
      {pushBanner && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-md border border-accent-emphasis/40 bg-accent-subtle px-4 py-2.5 text-sm text-fg">
          <span className="flex items-center gap-2">
            <RotateCw size={14} className="text-accent-fg" />
            New commits have been pushed to this repository.
          </span>
          <button onClick={() => setPushBanner(false)} className="text-fg-muted hover:text-fg">
            <X size={14} />
          </button>
        </div>
      )}
      {repoLoading || branchesLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-4">
          {/* Controls bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {!hasNoBranches && branchesData && (
                <BranchSelector
                  branches={branchesData.listBranches.branches}
                  currentBranch={ref}
                  owner={username}
                  repo={repo}
                  currentPath={path}
                />
              )}

              {/* Path breadcrumb */}
              {!hasNoBranches && path && (
                <nav className="flex items-center gap-1 text-sm">
                  <Link href={`/${username}/${repo}?ref=${ref}`} className="text-accent-fg hover:underline">
                    {repo}
                  </Link>
                  {path.split('/').map((seg, i, arr) => {
                    const partial = arr.slice(0, i + 1).join('/');
                    return (
                      <span key={partial} className="flex items-center gap-1">
                        <span className="text-fg-muted">/</span>
                        {i < arr.length - 1 ? (
                          <Link
                            href={`/${username}/${repo}?ref=${ref}&path=${encodeURIComponent(partial)}`}
                            className="text-accent-fg hover:underline"
                          >
                            {seg}
                          </Link>
                        ) : (
                          <span className="text-fg font-medium">{seg}</span>
                        )}
                      </span>
                    );
                  })}
                </nav>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Stats */}
              {!hasNoBranches && stats && (
                <div className="flex items-center gap-3 text-xs text-fg-muted">
                  <span>{formatBytes(stats.sizeBytes)}</span>
                  <span>{stats.commitCount} commits</span>
                </div>
              )}

              {/* Star button */}
              <Button
                size="sm"
                variant={isStarred ? 'primary' : 'secondary'}
                icon={<Star size={13} className={isStarred ? 'fill-current' : ''} />}
                loading={starring || unstarring}
                onClick={toggleStar}
              >
                {isStarred ? 'Unstar' : 'Star'}
                {repository && <span className="ml-1 opacity-70">{repository.stars}</span>}
              </Button>

              {!hasNoBranches && cloneData && <CloneButton cloneUrls={cloneData.getCloneURLs} />}
            </div>
          </div>

          {hasNoBranches ? (
            <EmptyRepoSetup owner={username} repo={repo} cloneUrls={cloneData?.getCloneURLs} />
          ) : (
            <div className="flex gap-6 items-start">
              {/* Main: file tree + README */}
              <div className="flex-1 min-w-0 space-y-4">
                {treeLoading && <div className="flex justify-center py-8"><Spinner /></div>}
                {treeData && (
                  <FileTree
                    entries={treeData.getRepositoryTree.entries}
                    owner={username}
                    repo={repo}
                    ref={ref}
                    currentPath={path}
                  />
                )}

                {/* README */}
                {readmeData?.getFileBlob && !readmeData.getFileBlob.isBinary && (
                  <div className="border border-border rounded-md overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-canvas-subtle border-b border-border">
                      <Eye size={14} className="text-fg-muted" />
                      <span className="text-sm font-medium text-fg">{readmeEntry?.name}</span>
                    </div>
                    <div className="px-6 py-5">
                      <MarkdownRenderer>{b64Decode(readmeData.getFileBlob.content)}</MarkdownRenderer>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <aside className="hidden lg:block w-60 flex-shrink-0">
                <RepoSidebar owner={username} repo={repo} repository={repository} />
              </aside>
            </div>
          )}
        </div>
      )}
    </RepoLayout>
  );
}
