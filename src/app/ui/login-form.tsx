'use client';

import { useFormStatus } from 'react-dom';
import { loginAction } from '@/app/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="button primary" type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>;
}

export function LoginForm() {
  return (
    <form action={loginAction} className="form-stack">
      <label>
        Username
        <input name="username" required />
      </label>
      <label>
        Password
        <input name="password" type="password" required />
      </label>
      <SubmitButton />
    </form>
  );
}
