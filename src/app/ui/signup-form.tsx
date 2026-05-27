'use client';

import { useSearchParams } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { signupClientAction } from '@/app/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="button primary" type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create client account'}</button>;
}

export function SignupForm() {
  const searchParams = useSearchParams();
  const inviteCode = (searchParams.get('invite') ?? searchParams.get('code') ?? '').trim();

  return (
    <form action={signupClientAction} className="form-stack">
      <input type="hidden" name="inviteCode" value={inviteCode} />
      {!inviteCode ? <p className="muted">Invite code missing from URL. Use a valid invite link.</p> : null}
      <label>Username<input name="username" required /></label>
      <label>First name<input name="firstName" required /></label>
      <label>Last name<input name="lastName" required /></label>
      <label>Email (optional)<input name="email" type="email" /></label>
      <label>Phone (optional)<input name="phone" /></label>
      <label>Timezone<input name="timezone" defaultValue="UTC" /></label>
      <label>Password<input name="password" type="password" minLength={6} required /></label>
      <SubmitButton />
    </form>
  );
}
