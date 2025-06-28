import React, { ReactNode, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface PopoverProps {
  open: boolean;
  anchorRect: DOMRect | null;
  onClose: () => void;
  children: ReactNode;
}

const Popover: React.FC<PopoverProps> = ({ open, anchorRect, onClose, children }) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => onClose();
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!open || !anchorRect) return null;

  const style: React.CSSProperties = {
    position: 'absolute',
    top: anchorRect.bottom + window.scrollY + 4,
    left: anchorRect.right - 150 + window.scrollX, // adjust 150 to your popover width
    zIndex: 9999,
    minWidth: 150,
  };

  return ReactDOM.createPortal(
    <div
      style={style}
      className="bg-white border rounded shadow-lg"
      onMouseDown={e => e.stopPropagation()} // <-- Add this line
    >
      {children}
    </div>,
    document.body
  );
};

export default Popover;