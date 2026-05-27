export type UserRole = 'client' | 'host' | 'admin';

export type NotificationChannel = 'browser' | 'inApp';
export type NotificationEventType =
  | 'reservation_created'
  | 'reservation_canceled'
  | 'slot_changed'
  | 'account_changed'
  | 'pool_assigned'
  | 'invite_created';

export type User = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  timezone: string;
  passwordHash: string;
  role: UserRole;
  admin: boolean;
  disabled: boolean;
  notificationPreferences: Record<NotificationChannel, boolean> & Record<NotificationEventType, boolean>;
  createdAt: string;
  updatedAt: string;
};

export type Pool = {
  id: string;
  name: string;
  topic: string;
  hostId: string;
  assignedClientIds: string[];
  notes: string;
  rules: {
    maxReservationsPerClient: number;
    maxTotalMinutesPerClient: number;
    bookingWindowDays: number;
    minimumNoticeMinutes: number;
    slotCapacity: number;
    allowedDurationsMinutes: number[];
    requireApproval: boolean;
  };
  timezone: string;
  createdAt: string;
  updatedAt: string;
};

export type Slot = {
  id: string;
  poolId: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  reservedStatus: 'open' | 'reserved' | 'freed' | 'canceled';
  reservedUserIds: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type Reservation = {
  id: string;
  slotId: string;
  poolId: string;
  userId: string;
  status: 'reserved' | 'canceled' | 'no-show' | 'freed';
  createdAt: string;
  updatedAt: string;
};

export type InviteType = 'user' | 'pool';

export type Invite = {
  id: string;
  code: string;
  type: InviteType;
  createdByUserId: string;
  poolId?: string;
  usedByUserIds: string[];
  revoked: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type NotificationItem = {
  id: string;
  userId: string;
  type: NotificationEventType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export type AuditEvent = {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
};

export type AppData = {
  users: User[];
  pools: Pool[];
  slots: Slot[];
  reservations: Reservation[];
  invites: Invite[];
  notifications: NotificationItem[];
  auditLog: AuditEvent[];
};

export type SessionUser = {
  id: string;
  username: string;
  role: UserRole;
  admin: boolean;
};