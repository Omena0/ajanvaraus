'use client';

import { useFormStatus } from 'react-dom';
import { signupClientAction } from '@/app/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="button primary" type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create client account'}</button>;
}

export function SignupForm({ inviteCode }: { inviteCode: string }) {

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
      <label>
        Password
        <input
          name="password"
          type="password"
          minLength={6}
          pattern="^(?=.*[A-Za-z])(?=.*\d).{6,}$"
          title="Password must be at least 6 characters with both letters and numbers"
          required
        />
        <p className="muted" style={{ fontSize: '0.8rem', margin: '4px 0 0' }}>At least 6 characters with letters and numbers</p>
      </label>
      <SubmitButton />
    </form>
  );
}
