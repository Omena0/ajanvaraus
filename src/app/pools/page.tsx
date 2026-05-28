import { redirect } from 'next/navigation';
import { readSession } from '@/lib/session';
import { getCurrentUser, getData } from '@/lib/store';
import { Badge, Card, Notice, Panel } from '@/components/ui';
import { ActionModal } from '@/components/action-modal';
import { ConfirmActionForm } from '@/components/confirm-action-form';
import { createInviteAction, createPoolAction, createSlotAction, deletePoolAction, deleteSlotAction, reserveSlotAction } from '@/app/actions';
import { formatDateTime } from '@/lib/format';

export default async function PoolsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await readSession();
  if (!session) redirect('/');
  const data = await getData();
  const user = getCurrentUser(data, session);
  if (!user) redirect('/');
  const canCreatePool = user.admin || user.role === 'host';
  const resolvedSearchParams = await searchParams;
  const createdCode = typeof resolvedSearchParams?.created === 'string' ? resolvedSearchParams.created : '';

  const pools = data.pools.filter((pool) => user.admin || pool.hostId === user.id || pool.assignedClientIds.includes(user.id));

  return (
    <div className="page-grid">
      <Panel
        title="Pools"
        subtitle="Manage pools, slots, and reservations from one place."
        action={
          canCreatePool ? (
            <ActionModal triggerLabel="Create pool" title="Create pool" description="Add a new pool and assign its host.">
              <form action={createPoolAction} className="modal-form">
                <input name="name" placeholder="Pool name" required />
                <input name="topic" placeholder="Topic" required />
                {user.admin ? (
                  <select name="hostId" defaultValue={data.users.find((item) => item.role === 'host' || item.admin)?.id ?? user.id}>
                    {data.users
                      .filter((item) => item.role === 'host' || item.admin)
                      .map((item) => <option key={item.id} value={item.id}>{item.username}</option>)}
                  </select>
                ) : (
                  <input type="hidden" name="hostId" value={user.id} />
                )}
                <input name="timezone" defaultValue="UTC" />
                <div className="modal-actions">
                  <button className="button primary" type="submit">Create pool</button>
                </div>
              </form>
            </ActionModal>
          ) : undefined
        }
      >
        {createdCode ? <Notice tone="success">Invite created: {createdCode}</Notice> : null}
        <div className="grid cards-2">
          {pools.map((pool) => {
            const canEdit = user.admin || pool.hostId === user.id;
            const poolSlots = data.slots
              .filter((slot) => slot.poolId === pool.id)
              .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

            return (
              <Card key={pool.id} title={pool.name}>
                <p>{pool.topic}</p>
                <div className="pool-badges">
                  <Badge>{pool.timezone}</Badge>
                  <Badge>{poolSlots.length} slots</Badge>
                  <Badge>{pool.assignedClientIds.length} clients</Badge>
                </div>

                {canEdit ? (
                  <div className="pool-action-row">
                    <ActionModal
                      triggerLabel="Add slot"
                      title="Add slot"
                      description={`Create a new slot in ${pool.name}.`}
                    >
                      <form action={createSlotAction} className="modal-form">
                        <input type="hidden" name="poolId" value={pool.id} />
                        <input name="startsAt" type="datetime-local" required />
                        <input name="durationMinutes" type="number" defaultValue="60" min="15" />
                        <input name="notes" placeholder="Notes (audio transcript, special instructions, etc.)" />
                        <div className="modal-actions">
                          <button className="button primary" type="submit">Create slot</button>
                        </div>
                      </form>
                    </ActionModal>
                    <ActionModal
                      triggerLabel="Create invite"
                      title="Create invite"
                      description={`Create a pool invite for ${pool.name}.`}
                    >
                      <form action={createInviteAction} className="modal-form">
                        <input type="hidden" name="type" value="pool" />
                        <input type="hidden" name="poolId" value={pool.id} />
                        <input name="expiresAt" type="date" required />
                        <div className="modal-actions">
                          <button className="button primary" type="submit">Create invite</button>
                        </div>
                      </form>
                    </ActionModal>
                  </div>
                ) : null}

                {user.admin ? (
                  <div className="pool-action-row">
                    <ConfirmActionForm action={deletePoolAction} confirmMessage={`Delete pool ${pool.name}? This will remove all slots and reservations.`}>
                      <input type="hidden" name="poolId" value={pool.id} />
                      <button className="button danger" type="submit">Delete pool</button>
                    </ConfirmActionForm>
                  </div>
                ) : null}

                <div className="grid" style={{ gap: '10px' }}>
                  {poolSlots.length === 0 ? <p className="muted">No slots yet.</p> : null}
                  {poolSlots.map((slot) => {
                    const canReserve = slot.reservedStatus === 'open' && (user.admin || pool.assignedClientIds.includes(user.id) || pool.hostId === user.id);
                    return (
                      <div key={slot.id} className="card pool-slot-card" style={{ padding: '12px' }}>
                        <p>{formatDateTime(slot.startsAt)} – {formatDateTime(slot.endsAt)}</p>
                        <Badge>{slot.reservedStatus}</Badge>
                        <div className="pool-slot-actions">
                          {canReserve ? (
                            <form action={reserveSlotAction}>
                              <input type="hidden" name="slotId" value={slot.id} />
                              <button className="button primary" type="submit">Reserve</button>
                            </form>
                          ) : null}
                          {canEdit ? (
                            <ConfirmActionForm action={deleteSlotAction} confirmMessage={`Delete the slot at ${formatDateTime(slot.startsAt)}? This cannot be undone.`}>
                              <input type="hidden" name="slotId" value={slot.id} />
                              <button className="button danger" type="submit">Delete slot</button>
                            </ConfirmActionForm>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
