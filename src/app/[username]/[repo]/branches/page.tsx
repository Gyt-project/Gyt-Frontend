'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { GitBranch, Check, Trash2 } from 'lucide-react';
import { LIST_BRANCHES, GET_REPOSITORY, GET_DEFAULT_BRANCH } from '@/graphql/queries';
import { Repository, Branch, ListBranchesResponse } from '@/types';
import RepoLayout from '@/components/layout/RepoLayout';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { shortSha } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function BranchesPage() {
  const { username, repo } = useParams<{ username: string; repo: string }>();
  const { user } = useAuth();

  const { data: repoData } = useQuery<{ getRepository: Repository }>(GET_REPOSITORY, {
    variables: { owner: username, name: repo },
  });
  const { data: branchData, loading, refetch } = useQuery<{
    listBranches: ListBranchesResponse;
    getDefaultBranch: { branch: string };
  }>(
    LIST_BRANCHES,
    { variables: { owner: username, name: repo } }
  );
  const { data: defaultData } = useQuery<{ getDefaultBranch: { branch: string } }>(
    GET_DEFAULT_BRANCH,
    { variables: { owner: username, name: repo } }
  );

  const defaultBranch = defaultData?.getDefaultBranch.branch ?? 'main';
  const branches = branchData?.listBranches.branches ?? [];

  return (
    <RepoLayout owner={username} repo={repo} repository={repoData?.getRepository}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-fg flex items-center gap-2">
            <GitBranch size={18} />
            Branches
          </h2>
          <span className="text-sm text-fg-muted">{branches.length} branch{branches.length !== 1 ? 'es' : ''}</span>
        </div>

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
