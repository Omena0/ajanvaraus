import { Card, Panel } from '@/components/ui';
import { requireAdminData } from '../_lib';

type PieSegment = { label: string; value: number; color: string };

function formatPercent(value: number, total: number) {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

function PieChart({ title, subtitle, segments }: { title: string; subtitle: string; segments: PieSegment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const safeTotal = Math.max(total, 1);
  let accumulated = 0;

  const circles = segments.map((segment) => {
    const start = accumulated / safeTotal;
    accumulated += segment.value;
    const end = accumulated / safeTotal;
    const dash = Math.max(0, (end - start) * 100);
    const offset = 100 - start * 100;
    return (
      <circle
        key={segment.label}
        r="16"
        cx="18"
        cy="18"
        fill="transparent"
        stroke={segment.color}
        strokeWidth="12"
        strokeDasharray={`${dash} ${100 - dash}`}
        strokeDashoffset={offset}
        transform="rotate(-90 18 18)"
      />
    );
  });

  return (
    <div className="chart-card">
      <div>
        <h3>{title}</h3>
        <div className="chart-subtitle">{subtitle}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', alignItems: 'center' }}>
        <svg viewBox="0 0 36 36" width="120" height="120" aria-label={title}>
          <circle r="16" cx="18" cy="18" fill="rgba(255,255,255,0.04)" />
          {circles}
        </svg>
        <div className="chart-legend">
          {segments.map((segment) => (
            <span className="legend-item" key={segment.label}>
              <span className="legend-swatch" style={{ backgroundColor: segment.color }} />
              {segment.label} {formatPercent(segment.value, total)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function BarChart({ title, subtitle, items, color }: { title: string; subtitle: string; items: { label: string; value: number }[]; color: string }) {
  const total = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="chart-card">
      <div>
        <h3>{title}</h3>
        <div className="chart-subtitle">{subtitle}</div>
      </div>
      <div className="bar-list">
        {items.map((item) => (
          <div className="bar-row" key={item.label}>
            <div className="bar-row-header">
              <span>{item.label}</span>
              <span>{item.value}</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(item.value / total) * 100}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 100;
      const y = 100 - (value / max) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 100 100" width="100%" height="140" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default async function AdminAnalyticsPage() {
  const { data } = await requireAdminData();

  const reservationCount = data.reservations.filter((reservation) => reservation.status === 'reserved').length;
  const totalMinutesReserved = data.reservations
    .filter((reservation) => reservation.status === 'reserved')
    .reduce((sum, reservation) => {
      const slot = data.slots.find((item) => item.id === reservation.slotId);
      return sum + (slot?.durationMinutes || 0);
    }, 0);
  const poolCount = data.pools.length;
  const clientCount = data.users.filter((user) => user.role === 'client').length;
  const hostCount = data.users.filter((user) => user.role === 'host').length;
  const openSlots = data.slots.filter((slot) => slot.reservedStatus === 'open').length;
  const reservedSlots = data.slots.filter((slot) => slot.reservedStatus === 'reserved').length;
  const canceledSlots = data.slots.filter((slot) => slot.reservedStatus === 'canceled').length;
  const freedSlots = data.slots.filter((slot) => slot.reservedStatus === 'freed').length;
  const poolUsage = data.pools
    .map((pool) => ({
      label: pool.name,
      value: data.reservations.filter((reservation) => reservation.poolId === pool.id && reservation.status === 'reserved').length
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 5);
  const dailyReservations = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (6 - index));
    const label = `${String(date.getUTCMonth() + 1).padStart(2, '0')}/${String(date.getUTCDate()).padStart(2, '0')}`;
    const value = data.reservations.filter((reservation) => {
      const created = new Date(reservation.createdAt);
      return created.getUTCFullYear() === date.getUTCFullYear() && created.getUTCMonth() === date.getUTCMonth() && created.getUTCDate() === date.getUTCDate();
    }).length;
    return { label, value };
  });
  const totalUsers = Math.max(data.users.length, 1);

  return (
    <div className="page-grid chart-shell">
      <Panel title="Analytics" subtitle="System-wide statistics.">
        <div className="grid cards-4">
          <Card title="Reservations">
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '12px 0' }}>{reservationCount}</p>
            <p className="muted">active bookings</p>
          </Card>
          <Card title="Minutes reserved">
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '12px 0' }}>{totalMinutesReserved}</p>
            <p className="muted">total minutes</p>
          </Card>
          <Card title="Pools">
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '12px 0' }}>{poolCount}</p>
            <p className="muted">available</p>
          </Card>
          <Card title="Users">
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '12px 0' }}>{data.users.length}</p>
            <p className="muted">{clientCount} clients, {hostCount} hosts</p>
          </Card>
        </div>
      </Panel>

      <div className="chart-grid">
        <PieChart
          title="Slot status"
          subtitle="How the current schedule is distributed."
          segments={[
            { label: 'Open', value: openSlots, color: '#22c55e' },
            { label: 'Reserved', value: reservedSlots, color: '#7c3aed' },
            { label: 'Freed', value: freedSlots, color: '#3b82f6' },
            { label: 'Canceled', value: canceledSlots, color: '#6b7280' }
          ]}
        />

        <PieChart
          title="User mix"
          subtitle="Client vs host composition."
          segments={[
            { label: 'Clients', value: clientCount, color: '#2563eb' },
            { label: 'Hosts', value: hostCount, color: '#22c55e' },
            { label: 'Other', value: Math.max(totalUsers - clientCount - hostCount, 0), color: '#7c3aed' }
          ]}
        />

        <BarChart
          title="Top pools"
          subtitle="Pools with the most reservations."
          items={poolUsage.length > 0 ? poolUsage : [{ label: 'No data', value: 0 }]}
          color="linear-gradient(90deg, #7c3aed, #2563eb)"
        />

        <div className="chart-card">
          <div>
            <h3>Reservations over time</h3>
            <div className="chart-subtitle">Daily reservation creation over the last 7 days.</div>
          </div>
          <Sparkline values={dailyReservations.map((entry) => entry.value)} color="#22c55e" />
          <div className="chart-legend" style={{ justifyContent: 'space-between' }}>
            {dailyReservations.map((entry) => (
              <span key={entry.label} className="legend-item" style={{ gap: '6px' }}>
                <span className="legend-swatch" style={{ backgroundColor: '#22c55e' }} />
                {entry.label}: {entry.value}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
