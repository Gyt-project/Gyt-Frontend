import { ReactNode } from 'react';
import Header from './Header';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function PageLayout({ children, className = '' }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas text-fg flex flex-col">
      <Header />
      <main className={`flex-1 ${className}`}>{children}</main>
      <footer className="border-t border-border py-6 text-center text-xs text-fg-muted">
        © 2026 Ygit ·{' '}
        <span className="font-mono">git.lucamorgado.com</span>
        {' '}· Built with ♥
      </footer>
    </div>
  );
}
