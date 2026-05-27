import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import type { SessionUser } from '@/lib/types';

const sessionCookie = 'ajanvaraus_session';

export async function readSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return null;

  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export function sessionCookieName() {
  return sessionCookie;
}
