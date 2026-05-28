import { SignupForm } from '@/app/ui/signup-form';
import { Notice, Panel } from '@/components/ui';

function getQueryError(searchParams: Record<string, string | string[] | undefined> | undefined) {
  const value = searchParams?.error;
  return typeof value === 'string' ? value : '';
}

export default async function SignupPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const resolvedSearchParams = await searchParams;
  const error = getQueryError(resolvedSearchParams);
  const inviteCode = (resolvedSearchParams?.invite ?? resolvedSearchParams?.code ?? '').toString().trim();

  return (
    <div className="auth-shell">
      <Panel title="Client signup" subtitle="Invite link required. You will be signed in automatically after account creation.">
        {error ? (
          <Notice tone="error">
            {error === 'invite'
              ? 'Invite is invalid or expired. Please check the invite link and try again.'
              : error === 'username'
              ? 'Username is already taken. Please choose a different username.'
              : error === 'email'
              ? 'Email is already in use. Please use a different email address.'
              : error === 'invalid'
              ? 'Please fill all required fields. Password must be at least 6 characters with both letters and numbers.'
              : 'Unable to complete signup. Please try again or contact support.'}
          </Notice>
        ) : null}
        <SignupForm inviteCode={inviteCode} />
      </Panel>
    </div>
  );
}
