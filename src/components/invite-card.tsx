'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui';
import { ConfirmActionForm } from '@/components/confirm-action-form';
import { deleteInviteAction } from '@/app/actions';
import type { Invite } from '@/lib/types';

export function InviteCard({ invite }: { invite: Invite }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const inviteUrl = `${window.location.origin}/signup?invite=${invite.code}`;
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="invite-list-item">
      <div className="invite-list-main">
        <div>
          <h3>{invite.code}</h3>
          <p className="muted">{invite.type} invite</p>
          <p className="muted">Expires: {new Date(invite.expiresAt).toLocaleDateString()}</p>
          <p className="muted">Used by: {invite.usedByUserIds.length}</p>
        </div>
        <div className="invite-list-badges">
          <Badge>{invite.revoked ? 'revoked' : 'active'}</Badge>
        </div>
      </div>
      <div className="invite-list-actions">
        <button className="button primary" type="button" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        <ConfirmActionForm action={deleteInviteAction} confirmMessage={`Delete invite ${invite.code}? This cannot be undone.`}>
          <input type="hidden" name="inviteId" value={invite.id} />
          <button className="button danger" type="submit">Delete invite</button>
        </ConfirmActionForm>
      </div>
    </div>
  );
}
