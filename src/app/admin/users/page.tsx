import { Badge, Card, Panel } from '@/components/ui';
import { ConfirmActionForm } from '@/components/confirm-action-form';
import { requireAdminData } from '../_lib';
import { createUserAction, deleteUserAction, disableUserAction, toggleUserAdminAction } from '@/app/actions';

export default async function AdminUsersPage() {
  const { data, user: currentUser } = await requireAdminData();

  return (
    <div className="page-grid">
      <Panel title="Users" subtitle="Create or update access.">
        <form action={createUserAction} className="form-grid">
          <input name="username" placeholder="Username" required />
          <input name="email" type="email" placeholder="Email" required />
          <input name="firstName" placeholder="First name" required />
          <input name="lastName" placeholder="Last name" required />
          <select name="role" defaultValue="client">
            <option value="client">Client</option>
            <option value="host">Host</option>
          </select>
          <button className="button primary" type="submit">Create user</button>
        </form>
        <div className="grid cards-2">
          {data.users.map((user) => (
            <Card key={user.id} title={user.username}>
              <p>{user.firstName} {user.lastName}</p>
              <Badge>{user.role}</Badge>
              <Badge>{user.disabled ? 'disabled' : 'active'}</Badge>
              {user.id === currentUser.id ? <p className="muted">Current session account</p> : null}
              {user.id !== currentUser.id ? (
                <>
                  <form action={toggleUserAdminAction} className="form-inline">
                    <input type="hidden" name="userId" value={user.id} />
                    <button className="button secondary" type="submit">Toggle admin</button>
                  </form>
                  <form action={disableUserAction} className="form-inline">
                    <input type="hidden" name="userId" value={user.id} />
                    <button className="button secondary" type="submit">Disable/enable</button>
                  </form>
                  <ConfirmActionForm action={deleteUserAction} confirmMessage={`Delete user ${user.username}? This cannot be undone.`} className="form-inline">
                    <input type="hidden" name="userId" value={user.id} />
                    <button className="button danger" type="submit">Delete user</button>
                  </ConfirmActionForm>
                </>
              ) : null}
            </Card>
          ))}
        </div>
      </Panel>
    </div>
  );
}
