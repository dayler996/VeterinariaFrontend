import { createContext, useContext, useState, useRef, useCallback } from 'react';

const ConfirmContext = createContext();

export const ConfirmProvider = ({ children }) => {
  const [state, setState] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'danger',
  });
  const resolverRef = useRef(null);

  /**
   * Uso:
   *   const ok = await confirm('¿Eliminar?');                           // simple
   *   const ok = await confirm({                                        // completo
   *     title: 'Desactivar cliente',
   *     message: 'El cliente no aparecerá en la lista principal.',
   *     confirmText: 'Desactivar',
   *     variant: 'warning',
   *   });
   */
  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      const config = typeof options === 'string' ? { message: options } : options;
      setState({
        open: true,
        title: config.title || 'Confirmar acción',
        message: config.message || '',
        confirmText: config.confirmText || 'Confirmar',
        cancelText: config.cancelText || 'Cancelar',
        variant: config.variant || 'danger',
      });
      resolverRef.current = resolve;
    });
  }, []);

  const close = (result) => {
    setState(s => ({ ...s, open: false }));
    resolverRef.current?.(result);
    resolverRef.current = null;
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        {...state}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>');
  return ctx.confirm;
};

/* ═══════════════════════════════════════════════════
   Dialog interno
   ═══════════════════════════════════════════════════ */
const variants = {
  danger: {
    icon: '🗑️',
    iconBg: 'bg-red-100',
    confirmBtn: 'bg-red-600 hover:bg-red-700',
  },
  warning: {
    icon: '⚠️',
    iconBg: 'bg-amber-100',
    confirmBtn: 'bg-amber-500 hover:bg-amber-600',
  },
  info: {
    icon: 'ℹ️',
    iconBg: 'bg-blue-100',
    confirmBtn: 'bg-blue-600 hover:bg-blue-700',
  },
  success: {
    icon: '✓',
    iconBg: 'bg-green-100',
    confirmBtn: 'bg-green-600 hover:bg-green-700',
  },
};

const ConfirmDialog = ({
  open, title, message, confirmText, cancelText, variant, onConfirm, onCancel,
}) => {
  if (!open) return null;
  const cfg = variants[variant] || variants.danger;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4
                 animate-[fadeIn_0.15s_ease-out]"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden
                      animate-[zoomIn_0.15s_ease-out]">
        {/* Cuerpo */}
        <div className="p-5 sm:p-6 text-center">
          <div className={`w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center text-2xl ${cfg.iconBg}`}>
            {cfg.icon}
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">
            {title}
          </h3>
          {message && (
            <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-2 p-3 bg-gray-50 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium
                       hover:bg-gray-100 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className={`flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-medium transition ${cfg.confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};