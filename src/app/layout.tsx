import type { ReactNode } from 'react';
import './globals.css';
import { readSession } from '@/lib/session';
import { getCurrentUser, getData } from '@/lib/store';
import { ToastProvider } from '@/components/toast-provider';
import { Sidebar } from '@/components/ui';

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await readSession();
  const data = await getData();
  const user = getCurrentUser(data, session);

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ToastProvider>
          <div className={user ? 'app-frame' : 'app-frame app-frame-auth'}>
            {user ? (
              <Sidebar
                user={user}
                items={[
                  { href: '/dashboard', label: 'Timeline' },
                  { href: '/pools', label: 'Pools' },
                  { href: '/settings', label: 'Settings' }
                ]}
                adminItems={user.admin ? [
                  { href: '/admin/analytics', label: 'Analytics' },
                  { href: '/admin/users', label: 'Users' },
                  { href: '/admin/invites', label: 'Invites' },
                  { href: '/admin/audit-log', label: 'Audit log' },
                  { href: '/admin/pools', label: 'Pools' }
                ] : undefined}
              />
            ) : null}
            <main className={user ? 'content' : 'content auth-content'}>{children}</main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
