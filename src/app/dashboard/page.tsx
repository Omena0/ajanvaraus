import { redirect } from 'next/navigation';
import { readSession } from '@/lib/session';
import { getCurrentUser, getData } from '@/lib/store';
import { Badge, Card, Panel } from '@/components/ui';
import { DashboardClient } from './dashboard-client';

export default async function DashboardPage() {
  const session = await readSession();
  if (!session) redirect('/');
  const data = await getData();
  const user = getCurrentUser(data, session);
  if (!user) redirect('/');

  const ownReservations = data.reservations.filter((reservation) => reservation.userId === user.id && reservation.status === 'reserved');
  const visibleSlots = data.slots.filter((slot) => {
    const pool = data.pools.find((item) => item.id === slot.poolId);
    return pool && (user.admin || pool.assignedClientIds.includes(user.id) || pool.hostId === user.id);
  });

  return (
    <DashboardClient 
      slots={visibleSlots} 
      pools={data.pools} 
      ownReservations={ownReservations}
      user={user}
    />
  );
}
