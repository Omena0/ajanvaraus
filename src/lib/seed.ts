import crypto from 'node:crypto';
import type { AppData, AuditEvent, Invite, NotificationItem, Pool, Reservation, Slot, User } from '@/lib/types';
import { hashPassword } from '@/lib/auth';

export async function buildSeedData(): Promise<AppData> {
  const now = new Date().toISOString();
  const adminHash = await hashPassword('admin');
  const hostHash = await hashPassword('host123');
  const clientHash = await hashPassword('client123');

  const users: User[] = [
    {
      id: crypto.randomUUID(),
      username: 'admin',
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@example.local',
      phone: '+000000000',
      timezone: 'UTC',
      passwordHash: adminHash,
      role: 'admin',
      admin: true,
      disabled: false,
      notificationPreferences: {
        browser: true,
        inApp: true,
        reservation_created: true,
        reservation_canceled: true,
        slot_changed: true,
        account_changed: true,
        pool_assigned: true,
        invite_created: true
      },
      createdAt: now,
      updatedAt: now
    },
    {
      id: crypto.randomUUID(),
      username: 'host',
      firstName: 'Hanna',
      lastName: 'Host',
      email: 'host@example.local',
      phone: '+111111111',
      timezone: 'Europe/Helsinki',
      passwordHash: hostHash,
      role: 'host',
      admin: false,
      disabled: false,
      notificationPreferences: {
        browser: true,
        inApp: true,
        reservation_created: true,
        reservation_canceled: true,
        slot_changed: true,
        account_changed: true,
        pool_assigned: true,
        invite_created: true
      },
      createdAt: now,
      updatedAt: now
    },
    {
      id: crypto.randomUUID(),
      username: 'client',
      firstName: 'Celia',
      lastName: 'Client',
      email: 'client@example.local',
      phone: '+222222222',
      timezone: 'Europe/Helsinki',
      passwordHash: clientHash,
      role: 'client',
      admin: false,
      disabled: false,
      notificationPreferences: {
        browser: true,
        inApp: true,
        reservation_created: true,
        reservation_canceled: true,
        slot_changed: true,
        account_changed: true,
        pool_assigned: true,
        invite_created: true
      },
      createdAt: now,
      updatedAt: now
    }
  ];

  const pools: Pool[] = [
    {
      id: crypto.randomUUID(),
      name: 'Therapy Intake',
      topic: 'New client bookings',
      hostId: users[1].id,
      assignedClientIds: [users[2].id],
      notes: 'Starter pool for onboarding.',
      rules: {
        maxReservationsPerClient: 2,
        maxTotalMinutesPerClient: 120,
        bookingWindowDays: 30,
        minimumNoticeMinutes: 60,
        slotCapacity: 1,
        allowedDurationsMinutes: [30, 60],
        requireApproval: false
      },
      timezone: 'Europe/Helsinki',
      createdAt: now,
      updatedAt: now
    }
  ];

  const slots: Slot[] = [
    {
      id: crypto.randomUUID(),
      poolId: pools[0].id,
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      endsAt: new Date(Date.now() + 86400000 + 60 * 60 * 1000).toISOString(),
      durationMinutes: 60,
      reservedStatus: 'open',
      reservedUserIds: [],
      notes: 'Morning intake block.',
      createdAt: now,
      updatedAt: now
    }
  ];

  const invites: Invite[] = [
    {
      id: crypto.randomUUID(),
      code: 'USERINVITE1',
      type: 'user',
      createdByUserId: users[0].id,
      usedByUserIds: [],
      revoked: false,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
      createdAt: now,
      updatedAt: now
    },
    {
      id: crypto.randomUUID(),
      code: 'POOLINVITE1',
      type: 'pool',
      createdByUserId: users[1].id,
      poolId: pools[0].id,
      usedByUserIds: [],
      revoked: false,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
      createdAt: now,
      updatedAt: now
    }
  ];

  const reservations: Reservation[] = [];
  const notifications: NotificationItem[] = [];
  const auditLog: AuditEvent[] = [];

  return { users, pools, slots, reservations, invites, notifications, auditLog };
}
