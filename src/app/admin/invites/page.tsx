import { Panel } from '@/components/ui';
import { ActionModal } from '@/components/action-modal';
import { Notice } from '@/components/ui';
import { InviteCard } from '@/components/invite-card';
import { requireAdminData } from '../_lib';
import { createInviteAction } from '@/app/actions';

export default async function AdminInvitesPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { data } = await requireAdminData();
  const resolvedSearchParams = await searchParams;
  const createdCode = typeof resolvedSearchParams?.created === 'string' ? resolvedSearchParams.created : '';

  return (
    <div className="page-grid">
      <Panel
        title="Invites"
        subtitle="Create reusable invite links."
        action={
          <ActionModal triggerLabel="Create invite" title="Create invite" description="Generate a reusable invite link.">
            <form action={createInviteAction} className="modal-form">
              <input type="hidden" name="returnTo" value="/admin/invites" />
              <select name="type" defaultValue="user">
                <option value="user">User invite</option>
                <option value="pool">Pool invite</option>
              </select>
              <select name="poolId" defaultValue="">
                <option value="">No pool</option>
                {data.pools.map((pool) => <option key={pool.id} value={pool.id}>{pool.name}</option>)}
              </select>
              <input name="expiresAt" type="date" required />
              <div className="modal-actions">
                <button className="button primary" type="submit">Create invite</button>
              </div>
            </form>
          </ActionModal>
        }
      >
        {createdCode ? <Notice tone="success">Invite created: {createdCode}</Notice> : null}
        <div className="invite-list">
          {data.invites.map((invite) => (
            <InviteCard key={invite.id} invite={invite} />
          ))}
        </div>
      </Panel>
    </div>
  );
}
