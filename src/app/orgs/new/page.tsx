'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { useAuth } from '@/context/AuthContext';
import { CREATE_ORGANIZATION } from '@/graphql/mutations';
import { Organization } from '@/types';
import PageLayout from '@/components/layout/PageLayout';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { Building2 } from 'lucide-react';

export default function NewOrgPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  const [createOrg, { loading }] = useMutation<{ createOrganization: Organization }>(CREATE_ORGANIZATION, {
    onCompleted: (d) => router.push(`/orgs/${d.createOrganization.name}`),
    onError: (err) => setError(err.message),
  });

  if (!user) { router.push('/login'); return null; }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Organization name is required.'); return; }
    createOrg({
      variables: {
        input: {
          name: form.name,
          description: form.description || undefined,
        },
      },
    });
  };

  const update = (f: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [f]: e.target.value }));

  return (
    <PageLayout>
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Building2 size={24} className="text-fg-muted" />
          <h1 className="text-xl font-bold text-fg">Create a new organization</h1>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {error && (
            <div className="bg-danger-muted border border-danger text-danger-fg text-sm rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <Input
            label="Organization name"
            placeholder="my-org"
            value={form.name}
            onChange={update('name')}
            hint="Cannot be changed later."
          />

          <Textarea
            label="Description (optional)"
            placeholder="What does this organization do?"
            rows={3}
            value={form.description}
            onChange={update('description')}
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" loading={loading}>
              Create organization
            </Button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
