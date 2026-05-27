import { redirect } from 'next/navigation';
import { readSession } from '@/lib/session';
import { getCurrentUser, getData } from '@/lib/store';
import { Panel } from '@/components/ui';
import { changePasswordAction, logoutAction } from '@/app/actions';

export default async function SettingsPage() {
  const session = await readSession();
  if (!session) redirect('/');
  const data = await getData();
  const user = getCurrentUser(data, session);
  if (!user) redirect('/');

  return (
    <div className="page-grid">
      <Panel title="Profile" subtitle="Basic account settings and password change.">
        <div className="card">
          <p>{user.firstName} {user.lastName}</p>
          <p className="muted">{user.email}</p>
          <p className="muted">{user.timezone}</p>
        </div>
        <form action={changePasswordAction} className="form-stack">
          <input name="currentPassword" type="password" placeholder="Current password" required />
          <input name="nextPassword" type="password" placeholder="New password" required />
          <button className="button primary" type="submit">Change password</button>
        </form>
        <form action={logoutAction}>
          <button className="button secondary" type="submit">Log out</button>
        </form>
      </Panel>
    </div>
  );
}
