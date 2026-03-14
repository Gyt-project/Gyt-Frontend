'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  GitBranch, Bell, Plus, Search, ChevronDown,
  LogOut, Settings, User as UserIcon, Building2,
  BookMarked, Star, Code2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Avatar from '@/components/ui/Avatar';
import Dropdown from '@/components/ui/Dropdown';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/explore?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-canvas-subtle border-b border-border flex items-center px-4 gap-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 flex-shrink-0">
        <Code2 size={22} className="text-accent-fg" />
        <span className="font-bold text-lg text-fg tracking-tight">Ygit</span>
      </Link>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" />
          <input
            type="text"
            placeholder="Search or jump to…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-canvas border border-border rounded-md text-fg placeholder-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent-fg"
          />
        </div>
      </form>

      <nav className="hidden md:flex items-center gap-1">
        <Link href="/explore" className="px-2 py-1 text-sm text-fg-muted hover:text-fg transition-colors rounded">
          Explore
        </Link>
      </nav>

      <div className="flex-1" />

      {user ? (
        <div className="flex items-center gap-2">
          {/* New */}
          <Dropdown
            trigger={
              <button className="flex items-center gap-0.5 text-fg-muted hover:text-fg transition-colors p-1.5 rounded-md hover:bg-canvas-overlay">
                <Plus size={16} />
                <ChevronDown size={12} />
              </button>
            }
            items={[
              { label: 'New repository', icon: <BookMarked size={14} />, onClick: () => router.push('/new') },
              { label: 'New organization', icon: <Building2 size={14} />, onClick: () => router.push('/orgs/new') },
            ]}
          />

          {/* User menu */}
          <Dropdown
            trigger={
              <button className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                <Avatar src={user.avatarUrl} name={user.displayName || user.username} size={28} />
                <ChevronDown size={12} className="text-fg-muted" />
              </button>
            }
            items={[
              { label: `Signed in as ${user.username}`, onClick: () => {} },
              { divider: true },
              { label: 'Your profile', icon: <UserIcon size={14} />, onClick: () => router.push(`/${user.username}`) },
              { label: 'Your repositories', icon: <BookMarked size={14} />, onClick: () => router.push(`/${user.username}/repositories`) },
              { label: 'Starred', icon: <Star size={14} />, onClick: () => router.push(`/${user.username}?tab=starred`) },
              { divider: true },
              { label: 'Settings', icon: <Settings size={14} />, onClick: () => router.push('/settings') },
              { divider: true },
              {
                label: 'Sign out',
                icon: <LogOut size={14} />,
                danger: true,
                onClick: () => { logout(); router.push('/'); },
              },
            ]}
          />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-3 py-1.5 text-sm text-fg hover:text-accent-fg transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-3 py-1.5 text-sm bg-accent hover:bg-accent-emphasis text-white rounded-md transition-colors font-medium"
          >
            Sign up
          </Link>
        </div>
      )}
    </header>
  );
}
