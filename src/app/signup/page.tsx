import { SignupForm } from '@/app/ui/signup-form';
import { Panel } from '@/components/ui';

export default function SignupPage() {
  return (
    <div className="auth-shell">
      <Panel title="Client signup" subtitle="Invite link required. You will be signed in automatically after account creation.">
        <SignupForm />
      </Panel>
    </div>
  );
}
