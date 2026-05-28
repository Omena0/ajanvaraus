import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readSession } from '@/lib/session';
import { getCurrentUser, getData } from '@/lib/store';
import { LoginForm } from '@/app/ui/login-form';
import { Notice, Panel } from '@/components/ui';

function getQueryError(searchParams: Record<string, string | string[] | undefined> | undefined) {
  const value = searchParams?.error;
  return typeof value === 'string' ? value : '';
}

export default async function Page({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await readSession();
  if (session) {
    const data = await getData();
    if (getCurrentUser(data, session)) redirect('/dashboard');
  }

  const resolvedSearchParams = await searchParams;
  const error = getQueryError(resolvedSearchParams);

  return (
    <div className="auth-shell">
      <Panel title="Sign in" subtitle="Use the seeded admin account or any user you create.">
        {error ? <Notice tone="error">{error === 'invalid' ? 'Invalid username or password.' : 'Sign in failed.'}</Notice> : null}
        <LoginForm />
        <p className="muted">Default admin: <strong>admin</strong> / <strong>admin</strong></p>
      </Panel>
    </div>
  );
}
