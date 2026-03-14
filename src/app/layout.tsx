import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ApolloWrapper } from '@/components/providers/ApolloWrapper';

export const metadata: Metadata = {
  title: { default: 'Ygit', template: '%s · Ygit' },
  description: 'A modern Git hosting platform',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ApolloWrapper>{children}</ApolloWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
