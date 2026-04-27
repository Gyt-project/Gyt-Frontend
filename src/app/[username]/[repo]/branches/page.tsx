'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { GitBranch, Plus, Trash2, X } from 'lucide-react';
import { LIST_BRANCHES, GET_REPOSITORY, GET_DEFAULT_BRANCH } from '@/graphql/queries';
import { CREATE_BRANCH } from '@/graphql/mutations';
import { Repository, Branch, ListBranchesResponse, DefaultBranchResponse } from '@/types';
import RepoLayout from '@/components/layout/RepoLayout';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { shortSha } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSSE } from '@/lib/useSSE';

export default function BranchesPage() {
  const { username, repo } = useParams<{ username: string; repo: string }>();
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [source, setSource] = useState('');
  const [createError, setCreateError] = useState('');

  const { data: repoData } = useQuery<{ getRepository: Repository }>(GET_REPOSITORY, {
    variables: { owner: username, name: repo },
    context: { triggerNotFoundOn404: true },
  });
  const { data: branchData, loading, refetch } = useQuery<{ listBranches: ListBranchesResponse }>(
    LIST_BRANCHES,
    { variables: { owner: username, name: repo } }
  );
  const { data: defaultData } = useQuery<{ getDefaultBranch: DefaultBranchResponse }>(
    GET_DEFAULT_BRANCH,
    { variables: { owner: username, name: repo } }
  );

  const [createBranch, { loading: creating }] = useMutation(CREATE_BRANCH);

  // Live-refresh branch list when a push is detected.
  const sseWsPath = username && repo ? `/ws/repo/${username}/${repo}` : null;
  const handlePush = useCallback(() => { refetch(); }, [refetch]);
  useSSE(sseWsPath, (type) => { if (type === 'push') handlePush(); });

  const defaultBranch = defaultData?.getDefaultBranch?.branchName ?? 'master';
  const branches = branchData?.listBranches.branches ?? [];

  const openCreate = () => {
    setSource(defaultBranch);
    setNewBranchName('');
    setCreateError('');
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!newBranchName.trim()) return;
    setCreateError('');
    try {
      await createBranch({
        variables: { owner: username, name: repo, branchName: newBranchName.trim(), source },
      });
      setShowCreate(false);
      setNewBranchName('');
      refetch();
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create branch');
    }
  };

  const canWrite = user?.username === username;

  return (
    <RepoLayout owner={username} repo={repo} repository={repoData?.getRepository}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-fg flex items-center gap-2">
            <GitBranch size={18} />
            Branches
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-fg-muted">{branches.length} branch{branches.length !== 1 ? 'es' : ''}</span>
            {canWrite && (
              <Button size="sm" icon={<Plus size={14} />} onClick={openCreate}>
                New branch
              </Button>
            )}
          </div>
        </div>

        {/* Create branch form */}
        {showCreate && (
          <div className="border border-border rounded-md p-4 bg-canvas-subtle space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-fg">Create new branch</span>
              <button onClick={() => setShowCreate(false)} className="text-fg-muted hover:text-fg">
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                autoFocus
                placeholder="Branch name"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="flex-1 min-w-40 px-3 py-1.5 text-sm bg-canvas border border-border rounded text-fg placeholder-fg-subtle focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="px-3 py-1.5 text-sm bg-canvas border border-border rounded text-fg focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {branches.map((b) => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={handleCreate}
                loading={creating}
                disabled={!newBranchName.trim()}
              >
                Create
              </Button>
            </div>
            {createError && <p className="text-xs text-danger">{createError}</p>}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : branches.length === 0 ? (
          <EmptyState title="No branches" />
        ) : (
          <div className="border border-border rounded-md divide-y divide-border">
            {/* Default branch first */}
            {[
              ...branches.filter((b) => b.name === defaultBranch),
              ...branches.filter((b) => b.name !== defaultBranch),
            ].map((branch) => (
              <BranchRow
                key={branch.name}
                branch={branch}
                isDefault={branch.name === defaultBranch}
                owner={username}
                repo={repo}
                canDelete={user?.username === username && branch.name !== defaultBranch}
              />
            ))}
          </div>
        )}
      </div>
    </RepoLayout>
  );
}

function BranchRow({
  branch,
  isDefault,
  owner,
  repo,
  canDelete,
}: {
  branch: Branch;
  isDefault: boolean;
  owner: string;
  repo: string;
  canDelete: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-canvas-subtle/40">
      <div className="flex items-center gap-2 min-w-0">
        <GitBranch size={14} className="text-fg-muted shrink-0" />
        <Link
          href={`/${owner}/${repo}?ref=${branch.name}`}
          className="font-medium text-accent-fg hover:underline truncate"
        >
          {branch.name}
        </Link>
        {isDefault && <Badge variant="blue">default</Badge>}
      </div>

      <div className="flex items-center gap-3 text-xs text-fg-muted shrink-0 ml-4">
        {branch.commitSha && (
          <Link
            href={`/${owner}/${repo}/commit/${branch.commitSha}`}
            className="font-mono hover:text-accent-fg"
          >
            {shortSha(branch.commitSha)}
          </Link>
        )}
        {canDelete && (
          <button
            className="text-fg-muted hover:text-danger-fg p-1 rounded"
            title="Delete branch"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
