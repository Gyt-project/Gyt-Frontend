'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@apollo/client';
import { Code2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LOGIN } from '@/graphql/mutations';
import { AuthResponse } from '@/types';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ login: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const [loginMutation, { loading }] = useMutation<{ login: AuthResponse }>(LOGIN, {
    onCompleted: (data) => {
      const { accessToken, refreshToken, user } = data.login;
      login(accessToken, refreshToken, user);
      router.push('/');
    },
    onError: (err) => setError(err.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.login || !form.password) {
      setError('All fields are required.');
      return;
    }
    loginMutation({ variables: { input: form } });
  };

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
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 animate-fade-up">
          <div className="relative mb-4">
            <div className="absolute inset-0 blur-2xl bg-accent/30 rounded-full scale-150 glow-breathe" />
            <Code2 size={44} className="relative text-accent-fg" />
          </div>
          <h1 className="text-2xl font-bold text-fg">Sign in to Ygit</h1>
          <p className="text-sm text-fg-muted mt-1">Welcome back</p>
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
            label="Username or email"
            placeholder="username or email@example.com"
            autoComplete="username"
            value={form.login}
            onChange={(e) => setForm((f) => ({ ...f, login: e.target.value }))}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-fg">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full rounded-md border border-border bg-canvas-subtle px-3 py-1.5 pr-10 text-sm text-fg placeholder-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent-fg"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg"
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full justify-center" loading={loading}>
            Sign in
          </Button>
        </form>

        <div className="mt-4 text-center border border-border rounded-xl px-6 py-4 text-sm text-fg-muted bg-canvas-subtle/50 animate-fade-up-delay-2">
          New to Ygit?{' '}
          <Link href="/register" className="text-accent-fg hover:underline font-medium">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
