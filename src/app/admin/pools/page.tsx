import { Badge, Card, Panel } from '@/components/ui';
import { ActionModal } from '@/components/action-modal';
import { ConfirmActionForm } from '@/components/confirm-action-form';
import { requireAdminData } from '../_lib';
import { createPoolAction, deletePoolAction, deleteSlotAction } from '@/app/actions';

export default async function AdminPoolsPage() {
  const { data } = await requireAdminData();

  return (
    <div className="page-grid">
      <Panel
        title="Pools"
        subtitle="Create and manage all pools."
        action={
          <ActionModal triggerLabel="Create pool" title="Create pool" description="Add a new pool and assign its host.">
            <form action={createPoolAction} className="modal-form">
              <input name="name" placeholder="Pool name" required />
              <input name="topic" placeholder="Topic" required />
              <select name="hostId" defaultValue={data.users.find((user) => user.role === 'host')?.id ?? ''}>
                {data.users.filter((user) => user.role === 'host' || user.admin).map((user) => <option key={user.id} value={user.id}>{user.username}</option>)}
              </select>
              <input name="timezone" defaultValue="UTC" />
              <div className="modal-actions">
                <button className="button primary" type="submit">Create pool</button>
              </div>
            </form>
          </ActionModal>
        }
      >
        <div className="grid cards-2">
          {data.pools.map((pool) => (
            <Card key={pool.id} title={pool.name}>
              <p>{pool.topic}</p>
              <Badge>{pool.timezone}</Badge>
              <p className="muted">Slots: {data.slots.filter((slot) => slot.poolId === pool.id).length}</p>
              <p className="muted">Clients: {pool.assignedClientIds.length}</p>
              <ConfirmActionForm action={deletePoolAction} confirmMessage={`Delete pool ${pool.name}? This will remove its slots and reservations.`} className="form-inline">
                <input type="hidden" name="poolId" value={pool.id} />
                <button className="button danger" type="submit">Delete pool</button>
              </ConfirmActionForm>
              <div className="grid" style={{ gap: '8px' }}>
                {data.slots.filter((slot) => slot.poolId === pool.id).map((slot) => (
                  <ConfirmActionForm key={slot.id} action={deleteSlotAction} confirmMessage={`Delete slot starting ${new Date(slot.startsAt).toLocaleString()}? This cannot be undone.`} className="form-inline" style={{ justifyContent: 'space-between' }}>
                    <input type="hidden" name="slotId" value={slot.id} />
                    <span className="muted">{new Date(slot.startsAt).toLocaleString()}</span>
                    <button className="button danger" type="submit">Delete slot</button>
                  </ConfirmActionForm>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Panel>
    </div>
  );
}
