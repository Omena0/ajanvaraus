import { redirect } from 'next/navigation';
import { readSession } from '@/lib/session';
import { getCurrentUser, getData } from '@/lib/store';
import { Notice, Panel } from '@/components/ui';
import { ActionModal } from '@/components/action-modal';
import { changePasswordAction, logoutAction, updateProfileAction } from '@/app/actions';

function getQueryError(searchParams: Record<string, string | string[] | undefined> | undefined) {
  const value = searchParams?.error;
  return typeof value === 'string' ? value : '';
}

export default async function SettingsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await readSession();
  if (!session) redirect('/');
  const data = await getData();
  const user = getCurrentUser(data, session);
  if (!user) redirect('/');
  const resolvedSearchParams = await searchParams;
  const error = getQueryError(resolvedSearchParams);

  return (
    <div className="page-grid">
      <Panel
        title="Profile"
        subtitle="Basic account settings and password change."
        action={
          <div className="settings-actions">
            <ActionModal triggerLabel="Edit profile" title="Edit profile" description="Update your account details.">
              <form action={updateProfileAction} className="modal-form">
                <input name="firstName" defaultValue={user.firstName} placeholder="First name" required />
                <input name="lastName" defaultValue={user.lastName} placeholder="Last name" required />
                <input name="email" type="email" defaultValue={user.email} placeholder="Email" required />
                <input name="phone" defaultValue={user.phone} placeholder="Phone" />
                <input name="timezone" defaultValue={user.timezone || 'UTC'} placeholder="Timezone" />
                <div className="modal-actions">
                  <button className="button primary" type="submit">Save profile</button>
                </div>
              </form>
            </ActionModal>
            <ActionModal triggerLabel="Change password" title="Change password" description="Use your current password to set a new one.">
              <form action={changePasswordAction} className="modal-form">
                <input name="currentPassword" type="password" placeholder="Current password" required />
                <input name="nextPassword" type="password" placeholder="New password" required />
                <div className="modal-actions">
                  <button className="button primary" type="submit">Change password</button>
                </div>
              </form>
            </ActionModal>
          </div>
        }
      >
        {error ? <Notice tone="error">{error === 'password' ? 'Current password or new password is invalid.' : error === 'profile' ? 'Profile update failed. Check your details and try again.' : 'Unable to update your profile.'}</Notice> : null}
        <div className="card">
          <p>{user.firstName} {user.lastName}</p>
          <p className="muted">{user.email}</p>
          <p className="muted">{user.phone || 'No phone set'}</p>
          <p className="muted">{user.timezone}</p>
        </div>
        <form action={logoutAction}>
          <button className="button secondary" type="submit">Log out</button>
        </form>
      </Panel>
    </div>
  );
}
