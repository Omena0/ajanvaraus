'use client';

import { useState } from 'react';
import { Card, Badge } from '@/components/ui';
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
    <Card title={invite.code}>
      <p className="muted">{invite.type} invite</p>
      <Badge>{invite.revoked ? 'revoked' : 'active'}</Badge>
      <p className="muted" style={{ fontSize: '0.8rem', marginTop: '8px' }}>
        Expires: {new Date(invite.expiresAt).toLocaleDateString()}
      </p>
      <p className="muted" style={{ fontSize: '0.8rem' }}>
        Used by: {invite.usedByUserIds.length}
      </p>
      <button className="button primary" type="button" onClick={handleCopy} style={{ marginTop: '12px', width: '100%' }}>
        {copied ? 'Copied!' : 'Copy link'}
      </button>
      <ConfirmActionForm action={deleteInviteAction} confirmMessage={`Delete invite ${invite.code}? This cannot be undone.`}>
        <input type="hidden" name="inviteId" value={invite.id} />
        <button className="button danger" type="submit" style={{ width: '100%' }}>Delete invite</button>
      </ConfirmActionForm>
    </Card>
  );
}
