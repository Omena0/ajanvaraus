import Link from 'next/link';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { logoutAction } from '@/app/actions';

export function Shell({ children }: { children: ReactNode }) {
  return <div className="shell">{children}</div>;
}

export function Sidebar({
  user,
  items,
  adminItems
}: {
  user: { username: string; role: string; admin: boolean } | null;
  items: { href: string; label: string }[];
  adminItems?: { href: string; label: string }[];
}) {
  return (
    <aside className="sidebar">
      <div>
        <div className="brand">Ajanvaraus</div>
        <div className="muted">Dark booking workspace</div>
      </div>
      <nav className="nav">
        {items.map((item) => (
          <Link key={item.href} className="nav-link" href={item.href}>
            {item.label}
          </Link>
        ))}
        {adminItems && adminItems.length > 0 ? (
          <div className="nav-group">
            <div className="nav-group-title">Admin</div>
            <div className="nav-group-links">
              {adminItems.map((item) => (
                <Link key={item.href} className="nav-link nav-link-sub" href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </nav>
      <div className="user-card">
        <div className="small">Signed in as</div>
        <div className="strong">{user ? user.username : 'Guest'}</div>
        <div className="muted">{user ? `${user.role}${user.admin ? ' · admin' : ''}` : 'not logged in'}</div>
      </div>
      {user ? (
        <div className="sidebar-actions">
          <form action={logoutAction}>
            <button className="button secondary sidebar-button" type="submit">Sign out</button>
          </form>
        </div>
      ) : null}
    </aside>
  );
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'error' | 'success' }) {
  return <div className={clsx('notice', `notice-${tone}`)} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>;
}

export function Panel({ title, subtitle, children, id, action }: { title: string; subtitle?: string; children: ReactNode; id?: string; action?: ReactNode }) {
  return (
    <section className="panel" id={id}>
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action ? <div className="panel-action">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className={clsx('badge')}>{children}</span>;
}

export function PrimaryButton({ children }: { children: ReactNode }) {
  return <button className="button primary" type="submit">{children}</button>;
}

export function SecondaryButton({ children }: { children: ReactNode }) {
  return <button className="button secondary" type="submit">{children}</button>;
}
