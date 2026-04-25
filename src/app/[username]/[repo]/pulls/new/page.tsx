'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useLazyQuery, useMutation } from '@apollo/client';
import { ArrowLeft, GitCommit } from 'lucide-react';
import { GET_REPOSITORY, LIST_BRANCHES, COMPARE_BRANCHES, GET_DEFAULT_BRANCH } from '@/graphql/queries';
import { CREATE_PULL_REQUEST } from '@/graphql/mutations';
import { Repository, ListBranchesResponse, CompareResponse, DefaultBranchResponse } from '@/types';
import RepoLayout from '@/components/layout/RepoLayout';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

export default function NewPRPage() {
  const { username, repo } = useParams<{ username: string; repo: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const [headBranch, setHeadBranch] = useState('');
  const [baseBranch, setBaseBranch] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const { data: repoData } = useQuery<{ getRepository: Repository }>(GET_REPOSITORY, {
    variables: { owner: username, name: repo },
    context: { triggerNotFoundOn404: true },
  });
  const { data: branchesData } = useQuery<{ listBranches: ListBranchesResponse }>(LIST_BRANCHES, {
    variables: { owner: username, name: repo },
  });
  const { data: defaultBranchData } = useQuery<{ getDefaultBranch: DefaultBranchResponse }>(GET_DEFAULT_BRANCH, {
    variables: { owner: username, name: repo },
  });

  // Initialise baseBranch once the default branch is known
  useEffect(() => {
    const def = defaultBranchData?.getDefaultBranch?.branchName;
    if (def && !baseBranch) setBaseBranch(def);
  }, [defaultBranchData, baseBranch]);
  const [compare, { data: compareData, loading: comparing }] = useLazyQuery<{
    compareBranches: CompareResponse;
  }>(COMPARE_BRANCHES);

  const [createPR, { loading: creating }] = useMutation(CREATE_PULL_REQUEST, {
    onCompleted: (data) => {
      router.push(`/${username}/${repo}/pulls/${data.createPullRequest.number}`);
    },
  });

  const branches = branchesData?.listBranches.branches ?? [];

  useEffect(() => {
    if (headBranch && baseBranch && headBranch !== baseBranch) {
      compare({ variables: { owner: username, name: repo, headBranch, baseBranch } });
      if (!title) setTitle(`Merge ${headBranch} into ${baseBranch}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headBranch, baseBranch]);

  const comparison = compareData?.compareBranches;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !headBranch || !baseBranch) return;
    createPR({
      variables: {
        input: {
          owner: username,
          repo,
          title,
          body: body || undefined,
          headBranch,
          baseBranch,
        },
      },
    });
  };

  if (!user) return null;
  return (
    <RepoLayout owner={username} repo={repo} repository={repoData?.getRepository}>
      <div className="max-w-3xl space-y-6">
        <h1 className="text-xl font-semibold text-fg">New pull request</h1>

        {/* Branch selector */}
        <div className="border border-border rounded-md p-4 space-y-3">
          <p className="text-sm text-fg-muted">Choose branches to compare</p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-fg-muted mb-1 block">Base branch</label>
              <select
                value={baseBranch}
                onChange={(e) => setBaseBranch(e.target.value)}
                className="w-full bg-canvas border border-border rounded-md px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {branches.map((b) => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
            <ArrowLeft size={16} className="text-fg-muted mt-5 shrink-0" />
            <div className="flex-1">
              <label className="text-xs text-fg-muted mb-1 block">Head branch</label>
              <select
                value={headBranch}
                onChange={(e) => setHeadBranch(e.target.value)}
                className="w-full bg-canvas border border-border rounded-md px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select branch…</option>
                {branches
                  .filter((b) => b.name !== baseBranch)
                  .map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
              </select>
            </div>
          </div>

          {/* Comparison stats */}
          {comparing && <div className="flex justify-center py-2"><Spinner size="sm" /></div>}
          {comparison && !comparing && (
            <div className="bg-canvas-subtle rounded-md p-3 text-sm space-y-1">
              <div className="flex gap-4 text-fg-muted">
                <span className="flex items-center gap-1">
                  <GitCommit size={13} />
                  {comparison.commits?.length ?? 0} commit{(comparison.commits?.length ?? 0) !== 1 ? 's' : ''}
                </span>
                <span className="text-success-fg">+{comparison.totalAdditions ?? 0}</span>
                <span className="text-danger-fg">-{comparison.totalDeletions ?? 0}</span>
                <span>{comparison.files?.length ?? 0} file{(comparison.files?.length ?? 0) !== 1 ? 's' : ''} changed</span>
              </div>
            </div>
          )}
        </div>

        {/* PR form */}
        {headBranch && headBranch !== baseBranch && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Pull request title"
              required
            />
            <Textarea
              label="Description"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe your changes…"
              rows={8}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" variant="primary" loading={creating} disabled={!title.trim()}>
                Create pull request
              </Button>
            </div>
          </form>
        )}
      </div>
    </RepoLayout>
  );
}
