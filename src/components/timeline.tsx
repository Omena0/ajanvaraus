'use client';

import { useState } from 'react';
import type { Slot, Pool } from '@/lib/types';

type TimelineRow = {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
  granularity: 'day' | 'week' | 'month';
};

function getTimelineRows(startDate: Date, direction: 'forward' | 'backward', offset: number): TimelineRow[] {
  const rows: TimelineRow[] = [];
  const today = new Date(startDate);
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setDate(start.getDate() + offset - 2);

  for (let i = 0; i < 4; i++) {
    const rowDate = new Date(start);
    rowDate.setDate(rowDate.getDate() + i);

    rows.push({
      id: `day-${rowDate.toISOString()}`,
      label: rowDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      startDate: new Date(rowDate),
      endDate: new Date(rowDate.getTime() + 24 * 60 * 60 * 1000),
      granularity: 'day'
    });
  }

  return rows;
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getSlotPosition(slot: Slot, rowStart: Date, rowEnd: Date) {
  const slotStart = new Date(slot.startsAt);
  const slotEnd = new Date(slot.endsAt);

  const rowDuration = rowEnd.getTime() - rowStart.getTime();
  const slotStartOffset = Math.max(0, slotStart.getTime() - rowStart.getTime());
  const slotDuration = Math.min(rowDuration - slotStartOffset, slotEnd.getTime() - Math.max(slotStart.getTime(), rowStart.getTime()));

  const leftPercent = Math.round((slotStartOffset / rowDuration) * 100 * 100) / 100;
  const widthPercent = Math.round((slotDuration / rowDuration) * 100 * 100) / 100;

  return { leftPercent, widthPercent, visible: widthPercent > 0 };
}

function getStatusColor(status: string) {
  switch (status) {
    case 'open':
      return '#22c55e';
    case 'reserved':
      return '#7c3aed';
    case 'freed':
      return '#3b82f6';
    case 'canceled':
      return '#6b7280';
    default:
      return '#64748b';
  }
}

export function Timeline({ slots, pools, onSlotClick }: { slots: Slot[]; pools: Pool[]; onSlotClick: (slot: Slot) => void }) {
  const [offset, setOffset] = useState(0);
  const rows = getTimelineRows(new Date(), 'forward', offset);

  return (
    <div className="timeline-container">
      <div className="timeline-rows">
        {rows.map((row) => (
          <div key={row.id} className="timeline-row">
            <div className="timeline-label">{row.label}</div>
            <div className="timeline-bar">
              {slots
                .filter((slot) => {
                  const slotStart = new Date(slot.startsAt);
                  return slotStart >= row.startDate && slotStart < row.endDate;
                })
                .map((slot) => {
                  const pool = pools.find((p) => p.id === slot.poolId);
                  const { leftPercent, widthPercent, visible } = getSlotPosition(slot, row.startDate, row.endDate);
                  if (!visible) return null;
                  return (
                    <div
                      key={slot.id}
                      className="timeline-slot"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${Math.max(2, widthPercent)}%`,
                        backgroundColor: getStatusColor(slot.reservedStatus)
                      }}
                      onClick={() => onSlotClick(slot)}
                      title={`${pool?.name} - ${formatTime(new Date(slot.startsAt))}`}
                      suppressHydrationWarning
                    />
                  );
                })}
            </div>
          </div>
        ))}
      </div>
      <div className="timeline-controls">
        <button className="timeline-btn" onClick={() => setOffset(offset - 1)} title="Previous">
          ↑
        </button>
        <button className="timeline-btn" onClick={() => setOffset(offset + 1)} title="Next">
          ↓
        </button>
      </div>
    </div>
  );
}
