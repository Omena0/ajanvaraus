import { Panel } from '@/components/ui';
import { requireAdminData } from '../_lib';
import { formatDateTime } from '@/lib/format';

export default async function AdminAuditLogPage() {
  const { data } = await requireAdminData();

  return (
    <div className="page-grid">
      <Panel title="Audit log" subtitle="System activity history.">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                <th style={{ textAlign: 'left', padding: '8px', color: 'var(--muted)' }}>Actor</th>
                <th style={{ textAlign: 'left', padding: '8px', color: 'var(--muted)' }}>Action</th>
                <th style={{ textAlign: 'left', padding: '8px', color: 'var(--muted)' }}>Entity</th>
                <th style={{ textAlign: 'left', padding: '8px', color: 'var(--muted)' }}>Details</th>
                <th style={{ textAlign: 'left', padding: '8px', color: 'var(--muted)' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.auditLog.slice(0, 50).map((event) => {
                const actor = data.users.find((user) => user.id === event.actorUserId);
                return (
                  <tr key={event.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '8px' }}>{actor?.username || 'system'}</td>
                    <td style={{ padding: '8px' }}>{event.action}</td>
                    <td style={{ padding: '8px' }}>{event.entityType}</td>
                    <td style={{ padding: '8px', color: 'var(--muted)', fontSize: '0.85rem' }}>{event.details}</td>
                    <td style={{ padding: '8px', color: 'var(--muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{formatDateTime(event.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
