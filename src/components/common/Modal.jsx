import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-7xl',
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlay = true,
  showCloseButton = true,
  footer,
}) => {
  const panelRef = useRef(null);

  // ── Bloquear scroll del body ──
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [isOpen]);

  // ── Cerrar con Escape ──
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // ── Focus al abrir ──
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => panelRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (!closeOnOverlay) return;
    if (panelRef.current && !panelRef.current.contains(e.target)) {
      onClose?.();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                 bg-black/50 backdrop-blur-sm p-0 sm:p-4
                 animate-[fadeIn_0.15s_ease-out]"
      onClick={handleOverlayClick}
    >
      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative w-full ${sizeClasses[size] || sizeClasses.md}
                    bg-white shadow-2xl outline-none
                    rounded-t-2xl sm:rounded-2xl
                    max-h-[95vh] sm:max-h-[90vh]
                    flex flex-col overflow-hidden
                    animate-[slideUp_0.2s_ease-out] sm:animate-[zoomIn_0.15s_ease-out]`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* ── Header sticky ── */}
        {(title || showCloseButton) && (
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3
                          px-4 sm:px-6 py-3 sm:py-4
                          bg-white border-b border-gray-100 shrink-0">
            {/* Drag handle visual en móvil */}
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-1
                            bg-gray-300 rounded-full sm:hidden" />

            <h2
              id="modal-title"
              className="text-base sm:text-lg font-semibold text-gray-800 truncate pr-2"
            >
              {title}
            </h2>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 -mr-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100
                           transition-colors shrink-0"
                aria-label="Cerrar"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* ── Contenido con scroll ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 sm:py-5">
          {children}
        </div>

        {/* ── Footer opcional ── */}
        {footer && (
          <div className="shrink-0 border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Renderiza en el body para evitar problemas de stacking context
  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};

export default Modal;