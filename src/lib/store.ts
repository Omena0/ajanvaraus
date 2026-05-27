import crypto from 'node:crypto';
import type { AppData, AuditEvent, Invite, NotificationItem, Pool, SessionUser, Slot, User } from '@/lib/types';
import { getData as getSnapshot } from '@/lib/spacetimedb';

export async function getData(): Promise<AppData> {
  return getSnapshot();
}

export async function saveData(_data: AppData) {
  return;
}

export function nowIso() {
  return new Date().toISOString();
}

export function id() {
  return crypto.randomUUID();
}

export async function logAudit(_data: AppData, _entry: Omit<AuditEvent, 'id' | 'createdAt'>) {
  return;
}

export async function notifyUser(
  _data: AppData,
  _userId: string,
  _type: NotificationItem['type'],
  _title: string,
  _body: string
) {
  return;
}

export function getUserById(data: AppData, userId: string) {
  return data.users.find((user) => user.id === userId);
}

export function getPoolById(data: AppData, poolId: string) {
  return data.pools.find((pool) => pool.id === poolId);
}

export function getSlotById(data: AppData, slotId: string) {
  return data.slots.find((slot) => slot.id === slotId);
}

export function getInviteByCode(data: AppData, code: string) {
  return data.invites.find((invite) => invite.code.toLowerCase() === code.toLowerCase());
}

export function getCurrentUser(data: AppData, sessionUser: SessionUser | null) {
  if (!sessionUser) return null;
  return data.users.find((user) => user.id === sessionUser.id) ?? null;
}
