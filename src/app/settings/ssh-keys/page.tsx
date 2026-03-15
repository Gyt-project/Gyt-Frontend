'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { Key, Plus, Trash2, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LIST_SSH_KEYS } from '@/graphql/queries';
import { ADD_SSH_KEY, DELETE_SSH_KEY } from '@/graphql/mutations';
import { ListSSHKeysResponse, SSHKey } from '@/types';
import PageLayout from '@/components/layout/PageLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';

export default function SSHKeysPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', publicKey: '' });
  const [formError, setFormError] = useState('');

  const { data, loading, refetch } = useQuery<{ listSSHKeys: ListSSHKeysResponse }>(LIST_SSH_KEYS, {
    variables: { username: user?.username ?? '' },
    skip: !user,
  });

  const [addKey, { loading: adding }] = useMutation(ADD_SSH_KEY, {
    onCompleted: () => { setModalOpen(false); setForm({ name: '', publicKey: '' }); refetch(); },
    onError: (err) => setFormError(err.message),
  });

  const [deleteKey] = useMutation(DELETE_SSH_KEY, {
    onCompleted: () => refetch(),
  });

  if (!user) { router.push('/login'); return null; }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.name || !form.publicKey) { setFormError('Both fields are required.'); return; }
    addKey({ variables: { input: { name: form.name, publicKey: form.publicKey.trim() } } });
  };

  const keys = data?.listSSHKeys.keys ?? [];

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
        <div className="relative max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key size={20} className="text-accent-fg" />
              <div>
                <h1 className="text-2xl font-bold text-fg">SSH Keys</h1>
                <p className="text-sm text-fg-muted mt-0.5">Manage SSH keys for Git access</p>
              </div>
            </div>
            <Button variant="primary" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>
              Add SSH key
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : keys.length === 0 ? (
          <EmptyState
            icon={<Key size={40} />}
            title="No SSH keys"
            description="Add an SSH key to authenticate Git operations without passwords."
            action={
              <Button variant="primary" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>
                Add SSH key
              </Button>
            }
          />
        ) : (
          <div className="border border-border rounded-md overflow-hidden">
            {keys.map((k: SSHKey) => (
              <div key={k.id} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
                <Key size={16} className="text-fg-muted flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-fg">{k.name}</p>
                  <p className="text-xs text-fg-muted font-mono truncate">{k.publicKey.slice(0, 60)}…</p>
                  <p className="flex items-center gap-1 text-xs text-fg-subtle mt-0.5">
                    <Clock size={10} />
                    Added {formatDate(k.createdAt)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  icon={<Trash2 size={12} />}
                  onClick={() => deleteKey({ variables: { keyId: k.id } })}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add new SSH key">
        <form onSubmit={submit} className="space-y-4">
          {formError && (
            <div className="bg-danger-muted border border-danger text-danger-fg text-sm rounded px-3 py-2">
              {formError}
            </div>
          )}
          <Input
            label="Title"
            placeholder="MacBook Pro"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-fg">Key</label>
            <textarea
              rows={5}
              placeholder="Begins with 'ssh-rsa', 'ssh-ed25519', 'ecdsa-sha2-nistp256', ..."
              value={form.publicKey}
              onChange={(e) => setForm((f) => ({ ...f, publicKey: e.target.value }))}
              className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-xs font-mono text-fg placeholder-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent resize-y"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={adding}>Add key</Button>
          </div>
        </form>
      </Modal>
    </PageLayout>
  );
}
