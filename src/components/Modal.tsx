import { useEffect, type MouseEvent } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  title: string;
  message: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Modal: React.FC<ModalProps> = ({ title, message, isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalRoot = document.getElementById('modal');
  if (!modalRoot) return null;

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  }

  return createPortal(
    <div 
      className="fixed top-0 left-0 w-screen h-screen bg-black/50 flex items-center justify-center z-1000"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-neutral-800 text-neutral-100 rounded-lg w-[90%] max-w-[500px] max-h-[90vh] overflow-y auto shadow-[0_4px_12px_rgba(0,0,0,0.15)] p-6">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="whitespace-pre-line text-justify">{message}</p>
        <button
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-bold py-2 px-4 mt-2 rounded"
          onClick={onClose}
        >
          Ok
        </button>
      </div>
    </div>,
    modalRoot
  );
}