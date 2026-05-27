import { redirect } from 'next/navigation';
import { readSession } from '@/lib/session';
import { getCurrentUser, getData } from '@/lib/store';
import { Badge, Card, Panel } from '@/components/ui';
import { ConfirmActionForm } from '@/components/confirm-action-form';
import { createSlotAction, deletePoolAction, deleteSlotAction, reserveSlotAction } from '@/app/actions';
import { formatDateTime } from '@/lib/format';

export default async function PoolsPage() {
  const session = await readSession();
  if (!session) redirect('/');
  const data = await getData();
  const user = getCurrentUser(data, session);
  if (!user) redirect('/');

  const pools = data.pools.filter((pool) => user.admin || pool.hostId === user.id || pool.assignedClientIds.includes(user.id));

  return (
    <div className="page-grid">
      <Panel title="Pools" subtitle="Manage pools, slots, and reservations from one place.">
        <div className="grid cards-2">
          {pools.map((pool) => {
            const canEdit = user.admin || pool.hostId === user.id;
            const poolSlots = data.slots
              .filter((slot) => slot.poolId === pool.id)
              .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

            return (
              <Card key={pool.id} title={pool.name}>
                <p>{pool.topic}</p>
                <div className="form-inline">
                  <Badge>{pool.timezone}</Badge>
                  <Badge>{poolSlots.length} slots</Badge>
                  <Badge>{pool.assignedClientIds.length} clients</Badge>
                </div>

                {canEdit ? (
                  <form action={createSlotAction} className="form-grid">
                    <input type="hidden" name="poolId" value={pool.id} />
                    <input name="startsAt" type="datetime-local" required />
                    <input name="durationMinutes" type="number" defaultValue="60" min="15" />
                    <input name="notes" placeholder="notes (audio transcript, special instructions, etc.)" />
                    <button className="button secondary" type="submit">Add slot</button>
                  </form>
                ) : null}

                {user.admin ? (
                  <ConfirmActionForm action={deletePoolAction} confirmMessage={`Delete pool ${pool.name}? This will remove all slots and reservations.`}>
                    <input type="hidden" name="poolId" value={pool.id} />
                    <button className="button danger" type="submit">Delete pool</button>
                  </ConfirmActionForm>
                ) : null}

                <div className="grid" style={{ gap: '10px' }}>
                  {poolSlots.length === 0 ? <p className="muted">No slots yet.</p> : null}
                  {poolSlots.map((slot) => {
                    const canReserve = slot.reservedStatus === 'open' && (user.admin || pool.assignedClientIds.includes(user.id) || pool.hostId === user.id);
                    return (
                      <div key={slot.id} className="card" style={{ padding: '12px' }}>
                        <p>{formatDateTime(slot.startsAt)} – {formatDateTime(slot.endsAt)}</p>
                        <Badge>{slot.reservedStatus}</Badge>
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
