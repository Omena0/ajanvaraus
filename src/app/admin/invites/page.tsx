import { Badge, Panel } from '@/components/ui';
import { InviteCard } from '@/components/invite-card';
import { requireAdminData } from '../_lib';
import { createInviteAction } from '@/app/actions';

export default async function AdminInvitesPage() {
  const { data } = await requireAdminData();

  return (
    <div className="page-grid">
      <Panel title="Invites" subtitle="Create reusable invite links.">
        <form action={createInviteAction} className="form-grid">
          <input name="code" placeholder="INVITE123" required />
          <select name="type" defaultValue="user">
            <option value="user">User invite</option>
            <option value="pool">Pool invite</option>
          </select>
          <select name="poolId" defaultValue="">
            <option value="">No pool</option>
            {data.pools.map((pool) => <option key={pool.id} value={pool.id}>{pool.name}</option>)}
          </select>
          <input name="expiresAt" type="date" required />
          <button className="button primary" type="submit">Create invite</button>
        </form>
        <div className="grid cards-2">
          {data.invites.map((invite) => (
            <InviteCard key={invite.id} invite={invite} />
          ))}
        </div>
      </Panel>
    </div>
  );
}
