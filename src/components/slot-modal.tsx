'use client';

import { reserveSlotAction, cancelReservationAction } from '@/app/actions';
import type { Slot, Pool } from '@/lib/types';
import { Badge } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { useToasts } from '@/components/toast-provider';

export function SlotDetailsModal({ slot, pool, onClose }: { slot: Slot | null; pool: Pool | null; onClose: () => void }) {
  const { notify } = useToasts();

  if (!slot || !pool) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{pool.name}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p><strong>Start:</strong> {formatDateTime(slot.startsAt)}</p>
          <p><strong>End:</strong> {formatDateTime(slot.endsAt)}</p>
          <p><strong>Duration:</strong> {slot.durationMinutes} minutes</p>
          <Badge>{slot.reservedStatus}</Badge>
          {slot.notes && <p><strong>Notes:</strong> {slot.notes}</p>}
        </div>
        <div className="modal-footer">
          {slot.reservedStatus === 'open' && (
            <form
              action={reserveSlotAction}
              style={{ display: 'flex', gap: '8px' }}
              onSubmit={() => {
                onClose();
                notify('Reserving slot...', 'info');
              }}
            >
              <input type="hidden" name="slotId" value={slot.id} />
              <button className="button primary" type="submit">Reserve</button>
            </form>
          )}
          {slot.reservedStatus === 'reserved' && (
            <form
              action={cancelReservationAction}
              style={{ display: 'flex', gap: '8px' }}
              onSubmit={() => {
                onClose();
                notify('Canceling reservation...', 'info');
              }}
            >
              <input type="hidden" name="slotId" value={slot.id} />
              <button className="button secondary" type="submit">Cancel reservation</button>
            </form>
          )}
          <button className="button secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
