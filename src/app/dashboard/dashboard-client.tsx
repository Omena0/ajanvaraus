'use client';

import { useState } from 'react';
import type { Slot, Pool, Reservation, User } from '@/lib/types';
import { Badge, Card, Panel } from '@/components/ui';
import { Timeline } from '@/components/timeline';
import { SlotDetailsModal } from '@/components/slot-modal';
import { cancelReservationAction } from '@/app/actions';
import { formatDateTime } from '@/lib/format';

export function DashboardClient({ slots, pools, ownReservations, user }: { slots: Slot[]; pools: Pool[]; ownReservations: Reservation[]; user: User }) {
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const selectedPool = selectedSlot ? pools.find((p) => p.id === selectedSlot.poolId) ?? null : null;

  return (
    <div className="page-grid">
      <Panel title="Timeline" subtitle="Your upcoming slots and reservations.">
        <Timeline slots={slots} pools={pools} onSlotClick={setSelectedSlot} />
      </Panel>

      <Panel title="My reservations" subtitle="Your active bookings.">
        <div className="grid cards-2">
          {ownReservations.length === 0 ? <Card title="No reservations yet"><p className="muted">Reserve a slot from Pools.</p></Card> : null}
          {ownReservations.map((reservation) => {
            const slot = slots.find((s) => s.id === reservation.slotId);
            const pool = pools.find((p) => p.id === reservation.poolId);
            if (!slot || !pool) return null;
            return (
              <Card key={reservation.id} title={pool.name}>
                <p>{formatDateTime(slot.startsAt)}</p>
                <Badge>{slot.reservedStatus}</Badge>
                <form action={cancelReservationAction}>
                  <input type="hidden" name="slotId" value={slot.id} />
                  <button className="button secondary" type="submit">Cancel</button>
                </form>
              </Card>
            );
          })}
        </div>
      </Panel>

      <SlotDetailsModal slot={selectedSlot} pool={selectedPool} onClose={() => setSelectedSlot(null)} />
    </div>
  );
}
