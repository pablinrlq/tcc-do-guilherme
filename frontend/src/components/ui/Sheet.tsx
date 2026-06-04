/** Bottom sheet modal (portal). Fecha ao clicar no overlay. */
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return createPortal(
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet">
        <div className="sheet__handle"></div>
        <div className="sheet__title">{title}</div>
        <div className="sheet__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
