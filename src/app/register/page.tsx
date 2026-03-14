'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@apollo/client';
import { Code2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { REGISTER } from '@/graphql/mutations';
import { AuthResponse } from '@/types';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const [register, { loading }] = useMutation<{ register: AuthResponse }>(REGISTER, {
    onCompleted: (data) => {
      const { accessToken, refreshToken, user } = data.register;
      login(accessToken, refreshToken, user);
      router.push('/');
    },
    onError: (err) => setError(err.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.email || !form.password) {
      setError('Username, email and password are required.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    register({
      variables: {
        input: {
          username: form.username,
          email: form.email,
          password: form.password,
        },
      },
    });
  };

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#cdd9e5 1px,transparent 1px),linear-gradient(90deg,#cdd9e5 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/10 rounded-full blur-3xl pointer-events-none glow-breathe" />

      <div className="relative w-full max-w-sm z-10">
        <div className="flex flex-col items-center mb-8 animate-fade-up">
          <div className="relative mb-4">
            <div className="absolute inset-0 blur-2xl bg-accent/30 rounded-full scale-150 glow-breathe" />
            <Code2 size={44} className="relative text-accent-fg" />
          </div>
          <h1 className="text-2xl font-bold text-fg">Create your account</h1>
          <p className="text-sm text-fg-muted mt-1">Join Ygit today — free forever</p>
        </div>

        <form
          onSubmit={submit}
          className="bg-canvas-subtle border border-border rounded-xl p-6 space-y-4 shadow-2xl shadow-black/40 animate-fade-up-delay"
        >
          {error && (
            <div className="bg-danger-muted border border-danger text-danger-fg text-sm rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <Input
            label="Username"
            placeholder="johndoe"
            autoComplete="username"
            value={form.username}
            onChange={update('username')}
            hint="Only letters, numbers, hyphens and underscores."
          />

          <Input
            label="Email"
            type="email"
            placeholder="john@example.com"
            autoComplete="email"
            value={form.email}
            onChange={update('email')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            value={form.password}
            onChange={update('password')}
          />

          <Button type="submit" variant="primary" className="w-full justify-center" loading={loading}>
            Create account
          </Button>

          <p className="text-xs text-fg-muted text-center">
            By signing up you agree to our terms and privacy policy.
          </p>
        </form>

        <div className="mt-4 text-center border border-border rounded-xl px-6 py-4 text-sm text-fg-muted bg-canvas-subtle/50 animate-fade-up-delay-2">
          Already have an account?{' '}
          <Link href="/login" className="text-accent-fg hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
