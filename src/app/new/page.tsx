'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import { BookMarked, Lock, Globe, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { CREATE_REPOSITORY } from '@/graphql/mutations';
import { LIST_USER_ORGANIZATIONS } from '@/graphql/queries';
import { Repository, ListOrgsResponse } from '@/types';
import PageLayout from '@/components/layout/PageLayout';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { clsx } from 'clsx';

export default function NewRepoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [owner, setOwner] = useState('');         // '' means personal account
  const [form, setForm] = useState({
    name: '',
    description: '',
    isPrivate: false,
  });
  const [error, setError] = useState('');

  const { data: orgsData } = useQuery<{ listUserOrganizations: ListOrgsResponse }>(
    LIST_USER_ORGANIZATIONS,
    { variables: { username: user?.username }, skip: !user }
  );
  const orgs = orgsData?.listUserOrganizations.organizations ?? [];

  const [createRepo, { loading }] = useMutation<{ createRepository: Repository }>(CREATE_REPOSITORY, {
    onCompleted: (data) => {
      router.push(`/${data.createRepository.ownerName}/${data.createRepository.name}`);
    },
    onError: (err) => setError(err.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Repository name is required.'); return; }
    if (!/^[a-zA-Z0-9_.-]+$/.test(form.name)) {
      setError('Repository name can only contain letters, numbers, hyphens, underscores, and periods.');
      return;
    }
    createRepo({
      variables: {
        input: {
          name: form.name,
          description: form.description || undefined,
          isPrivate: form.isPrivate,
          orgName: owner || undefined,
        },
      },
    });
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  const ownerLabel = owner
    ? (orgs.find((o) => o.name === owner)?.displayName || owner)
    : user.username;

  return (
    <PageLayout>
      {/* Page header */}
      <section className="relative border-b border-border overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#cdd9e5 1px,transparent 1px),linear-gradient(90deg,#cdd9e5 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-0 right-0 w-[450px] h-[180px] bg-accent/10 rounded-full blur-3xl pointer-events-none glow-breathe" />
        <div className="relative max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3">
            <BookMarked size={20} className="text-accent-fg" />
            <div>
              <h1 className="text-2xl font-bold text-fg">Create a new repository</h1>
              <p className="text-sm text-fg-muted mt-0.5">A repository contains all project files, including the revision history.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={submit} className="space-y-6">
          {error && (
            <div className="bg-danger-muted border border-danger text-danger-fg text-sm rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-2 items-end">
            {/* Owner dropdown */}
            <div className="flex-shrink-0">
              <label className="text-sm font-medium text-fg block mb-1">Owner</label>
              <div className="relative">
                <select
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 bg-canvas-subtle border border-border rounded-md text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent-fg cursor-pointer min-w-[140px]"
                >
                  <option value="">{user.username} (you)</option>
                  {orgs.map((o) => (
                    <option key={o.uuid} value={o.name}>
                      {o.displayName || o.name} (org)
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none" />
              </div>
            </div>
            <span className="text-fg-muted text-lg mb-1.5">/</span>
            <Input
              label="Repository name"
              placeholder="my-project"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="flex-1"
            />
          </div>

          <Textarea
            label="Description (optional)"
            placeholder="Short description of this repository"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />

          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-sm font-medium text-fg">Visibility</p>

            {[
              { value: false, icon: <Globe size={16} />, label: 'Public', desc: 'Anyone can see this repository.' },
              { value: true, icon: <Lock size={16} />, label: 'Private', desc: 'Only you and collaborators can access this repository.' },
            ].map((opt) => (
              <label
                key={String(opt.value)}
                className={clsx(
                  'flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-colors',
                  form.isPrivate === opt.value
                    ? 'border-accent-fg bg-accent-subtle'
                    : 'border-border hover:bg-canvas-subtle'
                )}
              >
                <input
                  type="radio"
                  name="visibility"
                  className="mt-0.5 accent-accent"
                  checked={form.isPrivate === opt.value}
                  onChange={() => setForm((f) => ({ ...f, isPrivate: opt.value }))}
                />
                <span className="text-accent-fg mt-0.5">{opt.icon}</span>
                <div>
                  <p className="text-sm font-medium text-fg">{opt.label}</p>
                  <p className="text-xs text-fg-muted">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="border-t border-border pt-4 flex justify-end">
            <Button type="submit" variant="primary" loading={loading}>
              Create repository
            </Button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
