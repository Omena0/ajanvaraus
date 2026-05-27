'use client';

import { useRef, useState } from 'react';
import type { CSSProperties, FormEvent, MouseEvent, ReactNode } from 'react';

type ConfirmActionFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  confirmMessage: string;
  confirmTitle?: string;
  confirmLabel?: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function ConfirmActionForm({
  action,
  confirmMessage,
  confirmTitle = 'Confirm action',
  confirmLabel = 'Confirm',
  children,
  className,
  style,
}: ConfirmActionFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const bypassConfirmRef = useRef(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (bypassConfirmRef.current) {
      bypassConfirmRef.current = false;
      return;
    }

    event.preventDefault();
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
    bypassConfirmRef.current = false;
  };

  const handleConfirm = () => {
    const form = formRef.current;
    if (!form) return;
    bypassConfirmRef.current = true;
    setOpen(false);
    form.requestSubmit();
  };

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  };

  return (
    <>
      <form ref={formRef} action={action} onSubmit={handleSubmit} className={className} style={style}>
        {children}
      </form>
      {open ? (
        <div className="confirm-dialog-backdrop" role="presentation" onClick={handleOverlayClick}>
          <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
            <div className="confirm-dialog-header">
              <h3 id="confirm-dialog-title">{confirmTitle}</h3>
            </div>
            <div className="confirm-dialog-body">
              <p>{confirmMessage}</p>
            </div>
            <div className="confirm-dialog-actions">
              <button className="button secondary" type="button" onClick={handleCancel} ref={confirmButtonRef}>
                Cancel
              </button>
              <button className="button danger" type="button" onClick={handleConfirm} autoFocus>
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
