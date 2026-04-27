'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { Building2, Plus, Trash2, UserMinus } from 'lucide-react';
import { GET_ORGANIZATION, LIST_ORG_MEMBERS } from '@/graphql/queries';
import {
  UPDATE_ORGANIZATION, DELETE_ORGANIZATION,
  ADD_ORG_MEMBER, REMOVE_ORG_MEMBER, UPDATE_ORG_MEMBER,
} from '@/graphql/mutations';
import { Organization, OrgMember } from '@/types';
import { useAuth } from '@/context/AuthContext';
import PageLayout from '@/components/layout/PageLayout';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import ErrorAlert from '@/components/ui/ErrorAlert';
import { formatError } from '@/lib/formatError';

export default function OrgSettingsPage() {
  const { orgName } = useParams<{ orgName: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const { data: orgData, loading, refetch } = useQuery<{ getOrganization: Organization }>(
    GET_ORGANIZATION, { variables: { name: orgName } }
  );
  const { data: membersData, loading: membersLoading, refetch: refetchMembers } = useQuery<{ listOrgMembers: { members: OrgMember[] } }>(
    LIST_ORG_MEMBERS, { variables: { orgName } }
  );

  const [form, setForm] = useState({ displayName: '', description: '', avatarUrl: '' });
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ username: '', role: 'member' });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orgData?.getOrganization) {
      const o = orgData.getOrganization;
      setForm({ displayName: o.displayName, description: o.description, avatarUrl: o.avatarUrl });
    }
  }, [orgData]);

  const [updateOrg, { loading: updating }] = useMutation(UPDATE_ORGANIZATION, {
    onCompleted: () => { setSaved(true); refetch(); setTimeout(() => setSaved(false), 3000); },
    onError: (e) => setError(formatError(e)),
  });
  const [deleteOrg] = useMutation(DELETE_ORGANIZATION, {
    onCompleted: () => router.push('/'),
    onError: (e) => setError(formatError(e)),
  });
  const [addMember, { loading: addingMember }] = useMutation(ADD_ORG_MEMBER, {
    onCompleted: () => { setAddModal(false); setAddForm({ username: '', role: 'member' }); refetchMembers(); },
  });
  const [removeMember] = useMutation(REMOVE_ORG_MEMBER, {
    onCompleted: () => refetchMembers(),
  });

  if (!user) { router.push('/login'); return null; }
  if (loading) return <PageLayout><div className="flex justify-center py-16"><Spinner /></div></PageLayout>;

  const update = (f: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  const submitOrg = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    updateOrg({ variables: { input: { name: orgName, ...form } } });
  };

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-xl font-bold text-fg flex items-center gap-2">
          <Building2 size={20} /> {orgName} — Organization Settings
        </h1>

        {/* General settings */}
        <section className="border border-border rounded-md overflow-hidden">
          <div className="px-4 py-3 bg-canvas-subtle border-b border-border">
            <h2 className="text-sm font-semibold text-fg">General</h2>
          </div>
          <form onSubmit={submitOrg} className="px-4 py-4 space-y-4">
            {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
            {saved && <div className="bg-success-muted border border-success text-success-fg text-sm rounded px-3 py-2">Saved!</div>}
            <Input label="Display name" value={form.displayName} onChange={update('displayName')} />
            <Textarea label="Description" value={form.description} onChange={update('description')} rows={3} />
            <Input label="Avatar URL" value={form.avatarUrl} onChange={update('avatarUrl')} />
            <Button type="submit" variant="primary" loading={updating}>Save</Button>
          </form>
        </section>

        {/* Members */}
        <section className="border border-border rounded-md overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-canvas-subtle border-b border-border">
            <h2 className="text-sm font-semibold text-fg">Members</h2>
            <Button size="sm" variant="primary" icon={<Plus size={13} />} onClick={() => setAddModal(true)}>
              Add member
            </Button>
          </div>
          {membersLoading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : (
            membersData?.listOrgMembers.members.map((m) => (
              <div key={m.user.uuid} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                <Avatar src={m.user.avatarUrl} name={m.user.displayName || m.user.username} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-fg font-medium">{m.user.username}</p>
                  <p className="text-xs text-fg-muted capitalize">{m.role}</p>
                </div>
                <Button
                  size="xs"
                  variant="ghost"
                  icon={<UserMinus size={12} />}
                  onClick={() => removeMember({ variables: { orgName, username: m.user.username } })}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </section>

        {/* Danger zone */}
        <section className="border border-danger rounded-md overflow-hidden">
          <div className="px-4 py-3 bg-danger-muted border-b border-danger">
            <h2 className="text-sm font-semibold text-danger-fg">Danger Zone</h2>
          </div>
          <div className="px-4 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-fg">Delete this organization</p>
              <p className="text-xs text-fg-muted">Once deleted, it cannot be recovered.</p>
            </div>
            <Button
              variant="danger"
              icon={<Trash2 size={14} />}
              onClick={() => { if (confirm(`Delete organization ${orgName}?`)) deleteOrg({ variables: { name: orgName } }); }}
            >
              Delete
            </Button>
          </div>
        </section>
      </div>

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add member">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addMember({ variables: { input: { orgName, username: addForm.username, role: addForm.role } } });
          }}
          className="space-y-4"
        >
          <Input
            label="Username"
            placeholder="johndoe"
            value={addForm.username}
            onChange={(e) => setAddForm((f) => ({ ...f, username: e.target.value }))}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-fg">Role</label>
            <select
              value={addForm.role}
              onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
              className="rounded-md border border-border bg-canvas-subtle px-3 py-1.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="member">Member</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setAddModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={addingMember}>Add</Button>
          </div>
        </form>
      </Modal>
    </PageLayout>
  );
}
