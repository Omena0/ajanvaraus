import { Badge, Notice, Panel } from '@/components/ui';
import { ActionModal } from '@/components/action-modal';
import { ConfirmActionForm } from '@/components/confirm-action-form';
import { requireAdminData } from '../_lib';
import { createUserAction, deleteUserAction, disableUserAction, toggleUserAdminAction } from '@/app/actions';

function getQueryError(searchParams: Record<string, string | string[] | undefined> | undefined) {
  const value = searchParams?.error;
  return typeof value === 'string' ? value : '';
}

export default async function AdminUsersPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { data, user: currentUser } = await requireAdminData();
  const resolvedSearchParams = await searchParams;
  const error = getQueryError(resolvedSearchParams);

  return (
    <div className="page-grid">
      <Panel
        title="Users"
        subtitle="Create or update access."
        action={
          <ActionModal triggerLabel="Create user" title="Create user" description="Add a new account and choose its role.">
            <form action={createUserAction} className="modal-form">
              <input name="username" placeholder="Username" required />
              <input name="email" type="email" placeholder="Email" required />
              <input name="firstName" placeholder="First name" required />
              <input name="lastName" placeholder="Last name" required />
              <input
                name="password"
                type="password"
                placeholder="Password"
                minLength={6}
                pattern="^(?=.*[A-Za-z])(?=.*\d).{6,}$"
                title="Password must be at least 6 characters with both letters and numbers"
                required
              />
              <select name="role" defaultValue="client">
                <option value="client">Client</option>
                <option value="host">Host</option>
              </select>
              <div className="modal-actions">
                <button className="button primary" type="submit">Create user</button>
              </div>
            </form>
          </ActionModal>
        }
      >
        {error ? <Notice tone="error">{error === 'missing' ? 'Username, email, and password are required.' : error === 'exists' ? 'Username or email already exists.' : error === 'password' ? 'Password must be at least 6 characters with both letters and numbers.' : 'Unable to create the user.'}</Notice> : null}
        <div className="users-list">
          {data.users.map((user) => (
            <div key={user.id} className="user-list-item">
              <div className="user-list-meta">
                <div>
                  <h3>{user.username}</h3>
                  <p>{user.firstName} {user.lastName}</p>
                  <p className="muted">{user.email}</p>
                </div>
                <div className="user-list-badges">
                  <Badge>{user.role}</Badge>
                  <Badge>{user.disabled ? 'disabled' : 'active'}</Badge>
                  {user.id === currentUser.id ? <Badge>current session</Badge> : null}
                </div>
              </div>
              {user.id !== currentUser.id ? (
                <div className="user-list-actions">
                  <form action={toggleUserAdminAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <button className="button secondary" type="submit">Toggle admin</button>
                  </form>
                  <form action={disableUserAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <button className="button secondary" type="submit">Disable/enable</button>
                  </form>
                  <ConfirmActionForm action={deleteUserAction} confirmMessage={`Delete user ${user.username}? This cannot be undone.`}>
                    <input type="hidden" name="userId" value={user.id} />
                    <button className="button danger" type="submit">Delete user</button>
                  </ConfirmActionForm>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
