import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readSession } from '@/lib/session';
import { getCurrentUser, getData } from '@/lib/store';
import { LoginForm } from '@/app/ui/login-form';
import { Panel } from '@/components/ui';

export default async function Page() {
  const session = await readSession();
  if (session) {
    const data = await getData();
    if (getCurrentUser(data, session)) redirect('/dashboard');
  }

  return (
    <div className="auth-shell">
      <Panel title="Sign in" subtitle="Use the seeded admin account or any user you create.">
        <LoginForm />
        <p className="muted">Default admin: <strong>admin</strong> / <strong>admin</strong></p>
      </Panel>
    </div>
  );
}
