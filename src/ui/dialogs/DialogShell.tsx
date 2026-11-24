import { type ReactNode, useEffect, useId, useRef } from 'react';
import { useAppStore } from '../../app/store';
import { Icon } from '../Icon';

interface DialogShellProps {
  title: string;
  wide?: boolean;
  testId: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** A parchment dialog over the darkened map; Escape, the close button and the backdrop close it. */
export function DialogShell({ title, wide = false, testId, children, footer }: DialogShellProps) {
  const closeDialog = useAppStore((state) => state.closeDialog);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') closeDialog();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [closeDialog]);

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <div
        ref={dialogRef}
        className={`dialog parchment parchment--framed${wide ? ' dialog--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid={testId}
      >
        <div className="dialog__head">
          <h2 id={titleId} className="display dialog__title">
            {title}
          </h2>
          <button type="button" className="ink-btn" aria-label="Kapat" data-testid="close-dialog" onClick={closeDialog}>
            <Icon name="close" />
          </button>
        </div>
        <hr className="rule" />
        <div className="dialog__body scroll">{children}</div>
        {footer && <div className="dialog__foot">{footer}</div>}
      </div>
    </div>
  );
}
