'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GitBranch, ChevronDown, Check, Plus, X } from 'lucide-react';
import { useMutation } from '@apollo/client';
import { Branch } from '@/types';
import { clsx } from 'clsx';
import { CREATE_BRANCH } from '@/graphql/mutations';

interface BranchSelectorProps {
  branches: Branch[];
  currentBranch: string;
  owner: string;
  repo: string;
  currentPath?: string;
  onSelect?: (branchName: string) => void;
}

export default function BranchSelector({
  branches,
  currentBranch,
  owner,
  repo,
  currentPath,
  onSelect,
}: BranchSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [source, setSource] = useState(currentBranch);
  const [createError, setCreateError] = useState('');
  const router = useRouter();

  const [createBranch, { loading: creating }] = useMutation(CREATE_BRANCH);

  const filtered = branches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const select = (branchName: string) => {
    setOpen(false);
    if (onSelect) {
      onSelect(branchName);
      return;
    }
    const path = currentPath ? `&path=${encodeURIComponent(currentPath)}` : '';
    router.push(`/${owner}/${repo}?ref=${branchName}${path}`);
  };

  const handleCreate = async () => {
    if (!newBranchName.trim()) return;
    setCreateError('');
    try {
      await createBranch({
        variables: { owner, name: repo, branchName: newBranchName.trim(), source },
      });
      setShowCreate(false);
      setNewBranchName('');
      setOpen(false);
      router.push(`/${owner}/${repo}?ref=${newBranchName.trim()}`);
      router.refresh();
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create branch');
    }
  };

  const openCreate = () => {
    setSource(currentBranch);
    setNewBranchName('');
    setCreateError('');
    setShowCreate(true);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 bg-canvas-subtle border border-border rounded-md text-sm text-fg hover:bg-canvas-overlay transition-colors"
      >
        <GitBranch size={14} className="text-fg-muted" />
        <span className="font-medium max-w-[120px] truncate">{currentBranch}</span>
        <ChevronDown size={14} className="text-fg-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setShowCreate(false); }} />
          <div className="absolute left-0 top-full mt-1 z-20 w-72 bg-canvas-overlay border border-border rounded-md shadow-xl">
            {!showCreate ? (
              <>
                <div className="p-2 border-b border-border">
                  <input
                    autoFocus
                    placeholder="Filter branches…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-2 py-1 text-sm bg-canvas border border-border rounded text-fg placeholder-fg-subtle focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {filtered.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-fg-muted">No branches found</p>
                  ) : (
                    filtered.map((b) => (
                      <button
                        key={b.name}
                        onClick={() => select(b.name)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-fg hover:bg-canvas-subtle transition-colors"
                      >
                        <Check
                          size={12}
                          className={clsx(b.name === currentBranch ? 'text-accent-fg' : 'invisible')}
                        />
                        <span className="truncate">{b.name}</span>
                      </button>
                    ))
                  )}
                </div>
                <div className="border-t border-border p-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); openCreate(); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-fg-muted hover:text-fg hover:bg-canvas-subtle rounded transition-colors"
                  >
                    <Plus size={14} />
                    <span>New branch</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-fg">Create branch</span>
                  <button onClick={() => setShowCreate(false)} className="text-fg-muted hover:text-fg">
                    <X size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  <input
                    autoFocus
                    placeholder="Branch name"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    className="w-full px-2 py-1.5 text-sm bg-canvas border border-border rounded text-fg placeholder-fg-subtle focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm bg-canvas border border-border rounded text-fg focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    {branches.map((b) => (
                      <option key={b.name} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                  {createError && (
                    <p className="text-xs text-danger">{createError}</p>
                  )}
                  <button
                    onClick={handleCreate}
                    disabled={creating || !newBranchName.trim()}
                    className="w-full py-1.5 text-sm bg-accent text-accent-fg rounded hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {creating ? 'Creating…' : 'Create branch'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
