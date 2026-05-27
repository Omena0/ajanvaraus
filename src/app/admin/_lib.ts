import { redirect } from 'next/navigation';
import { readSession } from '@/lib/session';
import { getCurrentUser, getData } from '@/lib/store';

export async function requireAdminData() {
  const session = await readSession();
  if (!session) redirect('/');

  const data = await getData();
  const user = getCurrentUser(data, session);
  if (!user?.admin) redirect('/dashboard');

  return { data, user };
}
