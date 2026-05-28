'use client';

import { useId, useState } from 'react';
import type { ReactNode } from 'react';

type ActionModalProps = {
  triggerLabel: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export function ActionModal({ triggerLabel, title, description, children }: ActionModalProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <button className="button primary" type="button" onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>
      {open ? (
        <div className="modal-overlay" role="presentation" onClick={() => setOpen(false)}>
          <div className="modal-content modal-content-create" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 id={titleId}>{title}</h3>
                {description ? <p className="modal-description">{description}</p> : null}
              </div>
              <button className="modal-close" type="button" onClick={() => setOpen(false)} aria-label="Close dialog">
                ×
              </button>
            </div>
            <div className="modal-body">
              {children}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
