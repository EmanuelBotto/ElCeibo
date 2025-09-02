import React from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  contentClassName?: string;
};

export default function Modal({ isOpen, onClose, children, contentClassName }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/80 animate-in fade-in-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-50 flex min-h-full items-center justify-center p-4">
        <div
          className={`bg-white rounded-lg shadow-lg p-6 w-full ${contentClassName ?? 'max-w-md'} relative text-gray-900`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
            aria-label="Cerrar"
          >
            ×
          </button>
          <div className="text-gray-900">{children}</div>
        </div>
      </div>
    </div>
  );
}