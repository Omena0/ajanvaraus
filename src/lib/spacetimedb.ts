import { buildSeedData } from '@/lib/seed';
import { DbConnection } from '@/lib/module_bindings';
import type { AppData, AuditEvent, Invite, NotificationItem, Pool, Reservation, SessionUser, Slot, User } from '@/lib/types';

let connectionPromise: Promise<DbConnection> | null = null;
let bootstrapPromise: Promise<void> | null = null;
let fallbackDataPromise: Promise<AppData> | null = null;

function normalizeConnectionError(error: unknown, fallbackMessage: string) {
  if (error instanceof Error) return error;

  if (typeof error === 'object' && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.length > 0) {
      return new Error(maybeMessage);
    }

    const maybeType = (error as { type?: unknown }).type;
    if (typeof maybeType === 'string' && maybeType.length > 0) {
      return new Error(`${fallbackMessage}: ${maybeType}`);
    }
  }

  return new Error(fallbackMessage);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = 500) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('SpacetimeDB connection timeout')), timeoutMs);
    }),
  ]);
}

function buildConnection() {
  const host = process.env.SPACETIMEDB_HOST ?? 'http://localhost:3000';
  const dbName = process.env.SPACETIMEDB_DB_NAME ?? 'ajanvaraus';

  return new Promise<DbConnection>((resolve, reject) => {
    try {
      DbConnection.builder()
        .withUri(host)
        .withDatabaseName(dbName)
        .onConnect((connection) => {
          connection
            .subscriptionBuilder()
            .onApplied(() => resolve(connection))
            .onError((ctx) => reject(normalizeConnectionError(ctx.event, 'SpacetimeDB subscription error')))
            .subscribe([
              'SELECT * FROM "user"',
              'SELECT * FROM pool',
              'SELECT * FROM slot',
              'SELECT * FROM reservation',
              'SELECT * FROM invite',
              'SELECT * FROM notification',
              'SELECT * FROM audit_event',
            ]);
        })
        .onConnectError((_ctx, error) => reject(normalizeConnectionError(error, 'SpacetimeDB connection failed')))
        .build();
    } catch (error) {
      reject(normalizeConnectionError(error, 'SpacetimeDB build failed'));
    }
  });
}

async function getConnection() {
  connectionPromise ??= buildConnection();
  return connectionPromise;
}

async function getFallbackData() {
  fallbackDataPromise ??= buildSeedData();
  return fallbackDataPromise;
}

async function bootstrapDemoData() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const connection = await getConnection();
      if (connection.db.user.count() > 0n) return;

      const seed = await buildSeedData();

      for (const user of seed.users) {
        await connection.reducers.createUser({
          actor_user_id: '',
          id: user.id,
          username: user.username,
          first_name: user.firstName,
          last_name: user.lastName,
          email: user.email,
          phone: user.phone,
          timezone: user.timezone,
          password_hash: user.passwordHash,
          role: user.role,
          admin: user.admin,
          disabled: user.disabled,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
        });
      }

      for (const pool of seed.pools) {
        await connection.reducers.createPool({
          actor_user_id: seed.users[0].id,
          id: pool.id,
          name: pool.name,
          topic: pool.topic,
          host_id: pool.hostId,
          assigned_client_ids: pool.assignedClientIds,
          notes: pool.notes,
          max_reservations_per_client: pool.rules.maxReservationsPerClient,
          max_total_minutes_per_client: pool.rules.maxTotalMinutesPerClient,
          booking_window_days: pool.rules.bookingWindowDays,
          minimum_notice_minutes: pool.rules.minimumNoticeMinutes,
          slot_capacity: pool.rules.slotCapacity,
          allowed_durations_minutes: pool.rules.allowedDurationsMinutes,
          require_approval: pool.rules.requireApproval,
          timezone: pool.timezone,
          created_at: pool.createdAt,
          updated_at: pool.updatedAt,
        });
      }

      for (const slot of seed.slots) {
        await connection.reducers.createSlot({
          actor_user_id: seed.users[0].id,
          id: slot.id,
          pool_id: slot.poolId,
          starts_at: slot.startsAt,
          ends_at: slot.endsAt,
          duration_minutes: slot.durationMinutes,
          notes: slot.notes,
          created_at: slot.createdAt,
          updated_at: slot.updatedAt,
        });
      }

      for (const invite of seed.invites) {
        await connection.reducers.createInvite({
          actor_user_id: seed.users[0].id,
          id: invite.id,
          code: invite.code,
          invite_type: invite.type,
          pool_id: invite.poolId,
          expires_at: invite.expiresAt,
          created_at: invite.createdAt,
          updated_at: invite.updatedAt,
        });
      }
    })();
  }

  await bootstrapPromise;
}

function mapUser(row: any): User {
  return {
    id: row.id,
    username: row.username,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    timezone: row.timezone,
    passwordHash: row.password_hash,
    role: row.role,
    admin: row.admin,
    disabled: row.disabled,
    notificationPreferences: {
      browser: row.browser_notifications,
      inApp: row.in_app_notifications,
      reservation_created: row.reservation_created,
      reservation_canceled: row.reservation_canceled,
      slot_changed: row.slot_changed,
      account_changed: row.account_changed,
      pool_assigned: row.pool_assigned,
      invite_created: row.invite_created,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPool(row: any): Pool {
  return {
    id: row.id,
    name: row.name,
    topic: row.topic,
    hostId: row.host_id,
    assignedClientIds: row.assigned_client_ids ?? [],
    notes: row.notes,
    rules: {
      maxReservationsPerClient: row.max_reservations_per_client,
      maxTotalMinutesPerClient: row.max_total_minutes_per_client,
      bookingWindowDays: row.booking_window_days,
      minimumNoticeMinutes: row.minimum_notice_minutes,
      slotCapacity: row.slot_capacity,
      allowedDurationsMinutes: row.allowed_durations_minutes ?? [],
      requireApproval: row.require_approval,
    },
    timezone: row.timezone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSlot(row: any): Slot {
  return {
    id: row.id,
    poolId: row.pool_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    durationMinutes: row.duration_minutes,
    reservedStatus: row.reserved_status,
    reservedUserIds: row.reserved_user_ids ?? [],
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReservation(row: any): Reservation {
  return {
    id: row.id,
    slotId: row.slot_id,
    poolId: row.pool_id,
    userId: row.user_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInvite(row: any): Invite {
  return {
    id: row.id,
    code: row.code,
    type: row.invite_type,
    createdByUserId: row.created_by_user_id,
    poolId: row.pool_id ?? undefined,
    usedByUserIds: row.used_by_user_ids ?? [],
    revoked: row.revoked,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapNotification(row: any): NotificationItem {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.notification_type,
    title: row.title,
    body: row.body,
    read: row.read,
    createdAt: row.created_at,
  };
}

function mapAuditEvent(row: any): AuditEvent {
  return {
    id: row.id,
    actorUserId: row.actor_user_id ?? null,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    details: row.details,
    createdAt: row.created_at,
  };
}

export async function getData(): Promise<AppData> {
  try {
    const connection = await withTimeout(getConnection(), 500);
    await bootstrapDemoData();

    return {
      users: Array.from(connection.db.user.iter(), mapUser),
      pools: Array.from(connection.db.pool.iter(), mapPool),
      slots: Array.from(connection.db.slot.iter(), mapSlot),
      reservations: Array.from(connection.db.reservation.iter(), mapReservation),
      invites: Array.from(connection.db.invite.iter(), mapInvite),
      notifications: Array.from(connection.db.notification.iter(), mapNotification),
      auditLog: Array.from(connection.db.audit_event.iter(), mapAuditEvent),
    };
  } catch {
    return getFallbackData();
  }
}

export async function withConnection<T>(run: (connection: DbConnection) => Promise<T> | T) {
  await bootstrapDemoData();
  const connection = await getConnection();
  return run(connection);
}

export async function getCurrentUserFromSession(sessionUser: SessionUser | null) {
  if (!sessionUser) return null;
  const data = await getData();
  return data.users.find((user) => user.id === sessionUser.id) ?? null;
}
