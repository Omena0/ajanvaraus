'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { hashPassword, issueSessionToken, toSessionUser, validatePassword, verifyPassword } from '@/lib/auth';
import { getCurrentUser, getData, getInviteByCode, getPoolById, getSlotById, getUserById, id, nowIso } from '@/lib/store';
import { withConnection } from '@/lib/spacetimedb';
import { readSession, sessionCookieName } from '@/lib/session';

type ToastType = 'success' | 'error' | 'info';

function actionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

async function setToast(message: string, type: ToastType = 'info') {
  const value = `${Date.now()}:${type}:${encodeURIComponent(message)}`;
  (await cookies()).set('app_toast', value, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 20,
  });
}

async function redirectWithToast(path: string, message: string, type: ToastType = 'info'): Promise<never> {
  await setToast(message, type);
  redirect(path);
}

async function requireSession() {
  const session = await readSession();
  if (!session) redirect('/');
  return session;
}

async function requireCurrentUser() {
  const session = await requireSession();
  const data = await getData();
  const user = getCurrentUser(data, session);
  if (!user) redirect('/');
  return { session, data, user };
}

export async function loginAction(formData: FormData) {
  const username = formValue(formData, 'username');
  const password = formValue(formData, 'password');
  const data = await getData();
  const foundUser = data.users.find((item) => item.username.toLowerCase() === username.toLowerCase());

  if (!foundUser || foundUser.disabled || !(await verifyPassword(password, foundUser.passwordHash))) {
    await redirectWithToast('/?error=invalid', 'Invalid username or password', 'error');
  }

  const user = foundUser!;

  const token = await issueSessionToken(toSessionUser(user));
  (await cookies()).set(sessionCookieName(), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  void withConnection((connection) =>
    connection.reducers.recordLogin({
      actor_user_id: user.id,
      details: `${user.username} logged in`,
      created_at: nowIso(),
    })
  ).catch(() => {});

  await setToast(`Welcome back, ${user.username}`, 'success');
  redirect('/dashboard');
}

export async function logoutAction() {
  (await cookies()).delete(sessionCookieName());
  await setToast('Signed out', 'info');
  redirect('/');
}

export async function signupClientAction(formData: FormData) {
  const inviteCode = formValue(formData, 'inviteCode');
  const username = formValue(formData, 'username');
  const firstName = formValue(formData, 'firstName');
  const lastName = formValue(formData, 'lastName');
  const emailInput = formValue(formData, 'email');
  const phone = formValue(formData, 'phone');
  const timezone = formValue(formData, 'timezone') || 'UTC';
  const password = formValue(formData, 'password');
  const inviteParam = inviteCode ? `?invite=${encodeURIComponent(inviteCode)}` : '';

  if (!validatePassword(password) || !inviteCode) {
    await redirectWithToast(`/signup${inviteParam}${inviteParam ? '&' : '?'}error=invalid`, 'Please fill all required fields with a valid password', 'error');
  }

  const data = await getData();
  const invite = getInviteByCode(data, inviteCode);
  if (!invite || invite.revoked || new Date(invite.expiresAt).getTime() < Date.now()) {
    await redirectWithToast(`/signup${inviteParam}${inviteParam ? '&' : '?'}error=invite`, 'Invite is invalid or expired', 'error');
  }

  if (data.users.some((item) => item.username.toLowerCase() === username.toLowerCase())) {
    await redirectWithToast(`/signup${inviteParam}${inviteParam ? '&' : '?'}error=username`, 'Username is already taken', 'error');
  }

  if (emailInput && data.users.some((item) => item.email.toLowerCase() === emailInput.toLowerCase())) {
    await redirectWithToast(`/signup${inviteParam}${inviteParam ? '&' : '?'}error=email`, 'Email is already in use', 'error');
  }

  const userId = id();
  const email = emailInput || `${username.toLowerCase()}+${Date.now()}@local.invalid`;
  const passwordHash = await hashPassword(password);
  await withConnection((connection) =>
    connection.reducers.signupClient({
      id: userId,
      username,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      timezone,
      password_hash: passwordHash,
      invite_code: inviteCode,
      created_at: nowIso(),
      updated_at: nowIso(),
    })
  );

  const token = await issueSessionToken({ id: userId, username, role: 'client', admin: false });
  (await cookies()).set(sessionCookieName(), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  await redirectWithToast('/dashboard', `Welcome, ${username}`, 'success');
}

export async function createInviteAction(formData: FormData) {
  const { user } = await requireCurrentUser();
  if (!user.admin) await redirectWithToast('/admin', 'Admin access required', 'error');

  const type = formValue(formData, 'type') as 'user' | 'pool';
  const code = formValue(formData, 'code').toUpperCase();
  const expiresAtDate = formValue(formData, 'expiresAt');
  const poolId = formValue(formData, 'poolId');

  await withConnection((connection) =>
    connection.reducers.createInvite({
      actor_user_id: user.id,
      id: id(),
      code,
      invite_type: type,
      pool_id: type === 'pool' && poolId ? poolId : undefined,
      expires_at: new Date(`${expiresAtDate}T00:00:00Z`).toISOString(),
      created_at: nowIso(),
      updated_at: nowIso(),
    })
  );

  revalidatePath('/admin');
  revalidatePath('/admin/invites');
  await setToast('Invite created', 'success');
}

export async function createPoolAction(formData: FormData) {
  const { user } = await requireCurrentUser();
  if (!user.admin) await redirectWithToast('/admin', 'Admin access required', 'error');

  const name = formValue(formData, 'name');
  const topic = formValue(formData, 'topic');
  const hostId = formValue(formData, 'hostId');
  const timezone = formValue(formData, 'timezone') || 'UTC';

  await withConnection((connection) =>
    connection.reducers.createPool({
      actor_user_id: user.id,
      id: id(),
      name,
      topic,
      host_id: hostId,
      assigned_client_ids: [],
      notes: '',
      max_reservations_per_client: 2,
      max_total_minutes_per_client: 120,
      booking_window_days: 30,
      minimum_notice_minutes: 60,
      slot_capacity: 1,
      allowed_durations_minutes: [30, 60],
      require_approval: false,
      timezone,
      created_at: nowIso(),
      updated_at: nowIso(),
    })
  );

  revalidatePath('/admin');
  revalidatePath('/admin/pools');
  await setToast('Pool created', 'success');
}

export async function createSlotAction(formData: FormData) {
  const { user } = await requireCurrentUser();
  const poolId = formValue(formData, 'poolId');
  const startsAt = formValue(formData, 'startsAt');
  const durationMinutes = Number(formValue(formData, 'durationMinutes') || '60');
  const notes = formValue(formData, 'notes');
  const data = await getData();
  const pool = getPoolById(data, poolId);
  if (!pool || (!user.admin && pool.hostId !== user.id)) {
    await redirectWithToast('/pools', 'You do not have permission to create a slot in this pool', 'error');
  }

  await withConnection((connection) =>
    connection.reducers.createSlot({
      actor_user_id: user.id,
      id: id(),
      pool_id: poolId,
      starts_at: startsAt,
      ends_at: new Date(new Date(startsAt).getTime() + durationMinutes * 60_000).toISOString(),
      duration_minutes: durationMinutes,
      notes,
      created_at: nowIso(),
      updated_at: nowIso(),
    })
  );

  revalidatePath('/pools');
  revalidatePath('/dashboard');
  await setToast('Slot created', 'success');
}

export async function reserveSlotAction(formData: FormData) {
  const { user } = await requireCurrentUser();
  const slotId = formValue(formData, 'slotId');
  const data = await getData();
  const slot = getSlotById(data, slotId);
  if (!slot) await redirectWithToast('/pools', 'Slot not found', 'error');
  const resolvedSlot = slot!;
  const pool = getPoolById(data, resolvedSlot.poolId);
  if (!pool) await redirectWithToast('/pools', 'Pool not found', 'error');
  const resolvedPool = pool!;
  if (resolvedSlot.reservedStatus !== 'open') await redirectWithToast('/pools?error=reserved', 'Slot is no longer available', 'error');
  if (!resolvedPool.assignedClientIds.includes(user.id) && !user.admin && resolvedPool.hostId !== user.id) {
    await redirectWithToast('/pools', 'You do not have permission to reserve this slot', 'error');
  }

  try {
    await withConnection((connection) =>
      connection.reducers.reserveSlot({
        actor_user_id: user.id,
        reservation_id: id(),
        slot_id: resolvedSlot.id,
        created_at: nowIso(),
        updated_at: nowIso(),
      })
    );
  } catch (error) {
    await setToast(actionErrorMessage(error, 'Failed to reserve slot'), 'error');
    revalidatePath('/dashboard');
    revalidatePath('/pools');
    return;
  }

  revalidatePath('/dashboard');
  revalidatePath('/pools');
  await setToast('Slot reserved', 'success');
}

export async function cancelReservationAction(formData: FormData) {
  const { user } = await requireCurrentUser();
  const slotId = formValue(formData, 'slotId');
  const data = await getData();
  const slot = getSlotById(data, slotId);
  if (!slot) {
    revalidatePath('/dashboard');
    revalidatePath('/pools');
    await setToast('Slot not found', 'error');
    return;
  }

  const reservation = data.reservations.find((item) => item.slotId === slot.id && item.status === 'reserved' && item.userId === user.id);
  if (!reservation) {
    revalidatePath('/dashboard');
    revalidatePath('/pools');
    await setToast('Reservation no longer exists', 'error');
    return;
  }

  try {
    await withConnection((connection) =>
      connection.reducers.cancelReservation({
        actor_user_id: user.id,
        slot_id: slot.id,
        updated_at: nowIso(),
      })
    );
  } catch (error) {
    await setToast(actionErrorMessage(error, 'Failed to cancel reservation'), 'error');
    revalidatePath('/dashboard');
    revalidatePath('/pools');
    return;
  }

  revalidatePath('/dashboard');
  revalidatePath('/pools');
  await setToast('Reservation canceled', 'success');
}

export async function toggleUserAdminAction(formData: FormData) {
  const { user } = await requireCurrentUser();
  if (!user.admin) await redirectWithToast('/admin', 'Admin access required', 'error');

  const userId = formValue(formData, 'userId');
  if (userId === user.id) {
    await setToast('You cannot remove your own admin access', 'error');
    revalidatePath('/admin/users');
    return;
  }
  const data = await getData();
  const target = getUserById(data, userId);
  if (!target) await redirectWithToast('/admin', 'User not found', 'error');
  const resolvedTarget = target!;

  await withConnection((connection) =>
    connection.reducers.toggleUserAdmin({
      actor_user_id: user.id,
      target_user_id: resolvedTarget.id,
      updated_at: nowIso(),
    })
  );

  revalidatePath('/admin');
  revalidatePath('/admin/users');
  await setToast('User admin status updated', 'success');
}

export async function disableUserAction(formData: FormData) {
  const { user } = await requireCurrentUser();
  if (!user.admin) await redirectWithToast('/admin', 'Admin access required', 'error');

  const userId = formValue(formData, 'userId');
  if (userId === user.id) {
    await setToast('You cannot disable your own account', 'error');
    revalidatePath('/admin/users');
    return;
  }
  const data = await getData();
  const target = getUserById(data, userId);
  if (!target) await redirectWithToast('/admin', 'User not found', 'error');
  const resolvedTarget = target!;

  await withConnection((connection) =>
    connection.reducers.disableUser({
      actor_user_id: user.id,
      target_user_id: resolvedTarget.id,
      updated_at: nowIso(),
    })
  );

  revalidatePath('/admin');
  revalidatePath('/admin/users');
  await setToast('User status updated', 'success');
}

export async function changePasswordAction(formData: FormData) {
  const { user } = await requireCurrentUser();

  const currentPassword = formValue(formData, 'currentPassword');
  const nextPassword = formValue(formData, 'nextPassword');
  if (!validatePassword(nextPassword) || !(await verifyPassword(currentPassword, user.passwordHash))) {
    await redirectWithToast('/settings?error=password', 'Password validation failed', 'error');
  }

  const nextPasswordHash = await hashPassword(nextPassword);
  await withConnection((connection) =>
    connection.reducers.changePassword({
      actor_user_id: user.id,
      user_id: user.id,
      password_hash: nextPasswordHash,
      updated_at: nowIso(),
    })
  );

  revalidatePath('/settings');
  await setToast('Password changed', 'success');
}

export async function createUserAction(formData: FormData) {
  const { user } = await requireCurrentUser();
  if (!user.admin) await redirectWithToast('/admin', 'Admin access required', 'error');

  const username = formValue(formData, 'username');
  const email = formValue(formData, 'email');
  const firstName = formValue(formData, 'firstName');
  const lastName = formValue(formData, 'lastName');
  const role = formValue(formData, 'role') as 'client' | 'host' | 'admin';
  const data = await getData();

  if (!username || !email) await redirectWithToast('/admin?error=missing', 'Username and email are required', 'error');
  if (data.users.some((item) => item.username.toLowerCase() === username.toLowerCase())) {
    await redirectWithToast('/admin?error=exists', 'Username already exists', 'error');
  }
  if (data.users.some((item) => item.email.toLowerCase() === email.toLowerCase())) {
    await redirectWithToast('/admin?error=exists', 'Email already exists', 'error');
  }

  const passwordHash = await hashPassword('temppass123');
  await withConnection((connection) =>
    connection.reducers.createUser({
      actor_user_id: user.id,
      id: id(),
      username,
      first_name: firstName,
      last_name: lastName,
      email,
      phone: '',
      timezone: 'UTC',
      password_hash: passwordHash,
      role,
      admin: role === 'admin',
      disabled: false,
      created_at: nowIso(),
      updated_at: nowIso(),
    })
  );

  revalidatePath('/admin');
  revalidatePath('/admin/users');
  await setToast('User created', 'success');
}

export async function deleteUserAction(formData: FormData) {
  const { user } = await requireCurrentUser();
  if (!user.admin) await redirectWithToast('/admin', 'Admin access required', 'error');

  const userId = formValue(formData, 'userId');
  if (userId === user.id) {
    await setToast('You cannot delete your own account', 'error');
    revalidatePath('/admin/users');
    return;
  }

  try {
    await withConnection((connection) =>
      connection.reducers.deleteUser({
        actor_user_id: user.id,
        target_user_id: userId,
        updated_at: nowIso(),
      })
    );
  } catch (error) {
    await setToast(actionErrorMessage(error, 'Failed to delete user'), 'error');
    revalidatePath('/admin/users');
    return;
  }

  revalidatePath('/admin');
  revalidatePath('/admin/users');
  revalidatePath('/pools');
  await setToast('User deleted', 'success');
}

export async function deleteInviteAction(formData: FormData) {
  const { user } = await requireCurrentUser();
  if (!user.admin) await redirectWithToast('/admin', 'Admin access required', 'error');

  const inviteId = formValue(formData, 'inviteId');
  try {
    await withConnection((connection) =>
      connection.reducers.deleteInvite({
        actor_user_id: user.id,
        invite_id: inviteId,
        updated_at: nowIso(),
      })
    );
  } catch (error) {
    await setToast(actionErrorMessage(error, 'Failed to delete invite'), 'error');
    revalidatePath('/admin/invites');
    return;
  }

  revalidatePath('/admin/invites');
  await setToast('Invite deleted', 'success');
}

export async function deletePoolAction(formData: FormData) {
  const { user } = await requireCurrentUser();
  if (!user.admin) await redirectWithToast('/admin', 'Admin access required', 'error');

  const poolId = formValue(formData, 'poolId');
  try {
    await withConnection((connection) =>
      connection.reducers.deletePool({
        actor_user_id: user.id,
        pool_id: poolId,
        updated_at: nowIso(),
      })
    );
  } catch (error) {
    await setToast(actionErrorMessage(error, 'Failed to delete pool'), 'error');
    revalidatePath('/admin/pools');
    revalidatePath('/pools');
    return;
  }

  revalidatePath('/admin/pools');
  revalidatePath('/admin/invites');
  revalidatePath('/pools');
  revalidatePath('/dashboard');
  await setToast('Pool deleted', 'success');
}

export async function deleteSlotAction(formData: FormData) {
  const { user } = await requireCurrentUser();
  const slotId = formValue(formData, 'slotId');

  try {
    await withConnection((connection) =>
      connection.reducers.deleteSlot({
        actor_user_id: user.id,
        slot_id: slotId,
        updated_at: nowIso(),
      })
    );
  } catch (error) {
    await setToast(actionErrorMessage(error, 'Failed to delete slot'), 'error');
    revalidatePath('/pools');
    revalidatePath('/admin/pools');
    return;
  }

  revalidatePath('/pools');
  revalidatePath('/admin/pools');
  revalidatePath('/dashboard');
  await setToast('Slot deleted', 'success');
}
