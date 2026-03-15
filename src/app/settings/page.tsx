'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { User as UserIcon, Camera } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UPDATE_USER } from '@/graphql/mutations';
import { User } from '@/types';
import PageLayout from '@/components/layout/PageLayout';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    avatarUrl: '',
    email: '',
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    setForm({
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      email: user.email,
    });
  }, [user, router]);

  const [updateUserMutation, { loading }] = useMutation<{ updateUser: User }>(UPDATE_USER, {
    onCompleted: (data) => {
      updateUser(data.updateUser);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err) => setError(err.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    updateUserMutation({
      variables: {
        input: {
          displayName: form.displayName || undefined,
          bio: form.bio || undefined,
          avatarUrl: form.avatarUrl || undefined,
          email: form.email || undefined,
        },
      },
    });
  };

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  if (!user) return null;

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
          <div className="flex items-center gap-3">
            <UserIcon size={20} className="text-accent-fg" />
            <div>
              <h1 className="text-2xl font-bold text-fg">Public Profile</h1>
              <p className="text-sm text-fg-muted mt-0.5">Update your public profile information</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar src={form.avatarUrl} name={form.displayName || user.username} size={120} />
              <div className="absolute bottom-0 right-0 bg-canvas-overlay border border-border rounded-full p-1.5">
                <Camera size={14} className="text-fg-muted" />
              </div>
            </div>
            <p className="text-xs text-fg-muted text-center">Provide an avatar URL below</p>
          </div>

          {/* Form */}
          <div className="md:col-span-2">
            <form onSubmit={submit} className="space-y-5">
              {error && (
                <div className="bg-danger-muted border border-danger text-danger-fg text-sm rounded-md px-3 py-2">
                  {error}
                </div>
              )}
              {saved && (
                <div className="bg-success-muted border border-success text-success-fg text-sm rounded-md px-3 py-2">
                  Profile saved successfully!
                </div>
              )}

              <Input
                label="Display name"
                value={form.displayName}
                onChange={update('displayName')}
                placeholder="Your full name"
              />

              <Textarea
                label="Bio"
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Tell us a little about yourself"
                rows={4}
              />

              <Input
                label="Avatar URL"
                value={form.avatarUrl}
                onChange={update('avatarUrl')}
                placeholder="https://example.com/avatar.png"
              />

              <Input
                label="Email address"
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="your@email.com"
              />

              <div className="pt-2">
                <Button type="submit" variant="primary" loading={loading}>
                  Save changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
