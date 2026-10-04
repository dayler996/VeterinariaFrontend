// frontend/src/components/common/SelectField.jsx
import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search as SearchIcon, X } from 'lucide-react';

/* ═══════════════════════════════════════════════════
   TONOS — color del acento según el contexto
   ═══════════════════════════════════════════════════ */
const TONES = {
  blue:    { ring: 'ring-blue-500',    bg: 'bg-blue-50',    border: 'border-blue-200',   text: 'text-blue-700',    icon: 'text-blue-600',    hover: 'hover:bg-blue-50',    check: 'text-blue-600'    },
  cyan:    { ring: 'ring-cyan-500',    bg: 'bg-cyan-50',    border: 'border-cyan-200',   text: 'text-cyan-700',    icon: 'text-cyan-600',    hover: 'hover:bg-cyan-50',    check: 'text-cyan-600'    },
  emerald: { ring: 'ring-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-600', hover: 'hover:bg-emerald-50', check: 'text-emerald-600' },
  violet:  { ring: 'ring-violet-500',  bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-700',  icon: 'text-violet-600',  hover: 'hover:bg-violet-50',  check: 'text-violet-600'  },
  pink:    { ring: 'ring-pink-500',    bg: 'bg-pink-50',    border: 'border-pink-200',    text: 'text-pink-700',    icon: 'text-pink-600',    hover: 'hover:bg-pink-50',    check: 'text-pink-600'    },
  slate:   { ring: 'ring-slate-500',   bg: 'bg-slate-100',  border: 'border-slate-300',   text: 'text-slate-700',   icon: 'text-slate-600',   hover: 'hover:bg-slate-100',  check: 'text-slate-600'   },
};

/* ═══════════════════════════════════════════════════
   SelectField — dropdown custom premium
   ═══════════════════════════════════════════════════ */
const SelectField = ({
  value,
  onChange,
  options = [],
  placeholder = 'Selecciona una opción...',
  disabled = false,
  state = 'idle',
  searchable,
  emptyMessage = 'No hay opciones disponibles',
  tone = 'blue',
  size = 'md', // 'sm' | 'md' | 'lg'
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  const toneCls = TONES[tone] || TONES.blue;

  /* Tamaños del trigger */
  const sizeCls = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-3.5 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
  }[size] || 'px-3.5 py-2.5 text-sm';

  const iconSizeCls = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-4.5 h-4.5',
  }[size] || 'w-4 h-4';

  /* Autodetectar búsqueda */
  const needsSearch = searchable !== undefined ? searchable : options.length > 8;

  /* Opción seleccionada */
  const selectedOption = useMemo(
    () => options.find((o) => String(o.value) === String(value)),
    [options, value]
  );

  /* Opciones filtradas */
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter(
      (o) =>
        String(o.label || '').toLowerCase().includes(q) ||
        String(o.description || '').toLowerCase().includes(q)
    );
  }, [options, search]);

  /* Reset highlight */
  useEffect(() => {
    setHighlightedIndex(0);
  }, [search, open]);

  /* Click outside */
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        cerrar();
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* Focus búsqueda */
  useEffect(() => {
    if (open && needsSearch && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 80);
    }
  }, [open, needsSearch]);

  /* Scroll al highlight */
  useEffect(() => {
    if (!open || !listRef.current) return;
    const item = listRef.current.children[highlightedIndex];
    if (item) item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [highlightedIndex, open]);

  const cerrar = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setOpen(false);
      setIsAnimatingOut(false);
      setSearch('');
    }, 120);
  };

  const abrir = () => {
    if (disabled) return;
    setOpen(true);
  };

  /* Teclado */
  const handleKeyDown = (e) => {
    if (!open) {
      if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        abrir();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((i) => (i < filteredOptions.length - 1 ? i + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((i) => (i > 0 ? i - 1 : filteredOptions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) handleSelect(filteredOptions[highlightedIndex]);
        break;
      case 'Escape':
        e.preventDefault();
        cerrar();
        break;
      case 'Tab':
        cerrar();
        break;
      default:
        break;
    }
  };

  const handleSelect = (option) => {
    onChange(option.value);
    cerrar();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  /* Estados visuales del trigger */
  const stateBorder = {
    idle:  'border-slate-300 hover:border-slate-400',
    valid: 'border-emerald-300 hover:border-emerald-400',
    error: 'border-red-400 hover:border-red-500',
  }[state] || 'border-slate-300';

  const openRing = {
    idle:  `ring-2 ${toneCls.ring}`,
    valid: 'ring-2 ring-emerald-500',
    error: 'ring-2 ring-red-500',
  }[state] || `ring-2 ${toneCls.ring}`;

  return (
    <div ref={containerRef} className="relative">
      {/* ═══ TRIGGER ═══ */}
      <button
        type="button"
        onClick={() => (open ? cerrar() : abrir())}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`group w-full flex items-center gap-2.5 text-left bg-white
                   border rounded-xl transition-all duration-150
                   focus:outline-none
                   ${sizeCls}
                   ${stateBorder}
                   ${open ? `${openRing} border-transparent shadow-sm` : 'shadow-sm hover:shadow'}
                   ${disabled
                     ? 'opacity-60 cursor-not-allowed bg-slate-50'
                     : 'cursor-pointer'}`}
      >
        {/* Icono de la opción seleccionada */}
        {selectedOption?.icon ? (
          <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
                            ${toneCls.bg} transition-colors`}>
            <selectedOption.icon
              className={`w-3.5 h-3.5 ${toneCls.icon}`}
              strokeWidth={2.4}
            />
          </span>
        ) : selectedOption ? (
          <span className={`shrink-0 w-2 h-2 rounded-full ${toneCls.bg} border ${toneCls.border}`} />
        ) : null}

        {/* Texto */}
        <span className="flex-1 min-w-0 truncate">
          {selectedOption ? (
            <span className="block text-slate-800 font-medium truncate">
              {selectedOption.label}
            </span>
          ) : (
            <span className="block text-slate-400 truncate">{placeholder}</span>
          )}
        </span>

        {/* Clear */}
        {selectedOption && !disabled && (
          <span
            role="button"
            tabIndex={-1}
            onClick={handleClear}
            onMouseDown={(e) => e.stopPropagation()}
            className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                       text-slate-400 hover:text-white hover:bg-red-500
                       transition-colors"
            aria-label="Limpiar selección"
          >
            <X className="w-3 h-3" strokeWidth={3} />
          </span>
        )}

        {/* Chevron */}
        <ChevronDown
          className={`shrink-0 text-slate-400 transition-transform duration-200
                     ${iconSizeCls}
                     ${open ? 'rotate-180 text-slate-600' : 'group-hover:text-slate-600'}`}
          strokeWidth={2.4}
        />
      </button>

      {/* ═══ DROPDOWN ═══ */}
      {open && (
        <div
          className={`absolute z-50 left-0 right-0 mt-2
                     bg-white rounded-xl
                     border border-slate-200
                     shadow-2xl shadow-slate-900/10
                     overflow-hidden
                     origin-top
                     transition-all duration-150 ease-out
                     ${isAnimatingOut
                       ? 'opacity-0 scale-[0.98] -translate-y-1'
                       : 'opacity-100 scale-100 translate-y-0'}`}
          style={{
            animation: isAnimatingOut ? 'none' : 'selectDropIn 0.15s ease-out',
          }}
        >
          {/* Search */}
          {needsSearch && (
            <div className="p-2 border-b border-slate-100 bg-slate-50/60">
              <div className="relative">
                <SearchIcon
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
                  strokeWidth={2.4}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe para buscar..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             placeholder:text-slate-400 transition"
                />
              </div>
            </div>
          )}

          {/* Lista */}
          <div
            ref={listRef}
            className="max-h-64 overflow-y-auto py-1.5
                       [&::-webkit-scrollbar]:w-1.5
                       [&::-webkit-scrollbar-thumb]:bg-slate-300
                       [&::-webkit-scrollbar-thumb]:rounded-full
                       [&::-webkit-scrollbar-thumb:hover]:bg-slate-400
                       [&::-webkit-scrollbar-track]:bg-transparent"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center">
                  <SearchIcon className="w-4 h-4 text-slate-400" strokeWidth={2.2} />
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {search ? `Sin resultados para "${search}"` : emptyMessage}
                </p>
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="mt-2 text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Limpiar búsqueda
                  </button>
                )}
              </div>
            ) : (
              filteredOptions.map((option, idx) => {
                const isSelected = String(option.value) === String(value);
                const isHighlighted = idx === highlightedIndex;
                const OptionIcon = option.icon;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg
                               text-left transition-colors duration-100
                      ${isSelected
                        ? `${toneCls.bg} ${toneCls.text}`
                        : isHighlighted
                        ? 'bg-slate-100'
                        : 'hover:bg-slate-50'}`}
                    style={{ width: 'calc(100% - 8px)' }}
                  >
                    {/* Icono */}
                    {OptionIcon && (
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors
                        ${isSelected
                          ? `bg-white ${toneCls.icon}`
                          : 'bg-slate-100 text-slate-500'}`}>
                        <OptionIcon className="w-4 h-4" strokeWidth={2.2} />
                      </span>
                    )}

                    {/* Texto */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${
                        isSelected ? 'font-semibold' : 'font-medium text-slate-700'
                      }`}>
                        {option.label}
                      </p>
                      {option.description && (
                        <p className={`text-[11px] truncate mt-0.5 ${
                          isSelected ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {option.description}
                        </p>
                      )}
                    </div>

                    {/* Check */}
                    {isSelected && (
                      <span className={`shrink-0 w-5 h-5 rounded-full bg-white flex items-center justify-center
                        shadow-sm ${toneCls.check}`}>
                        <Check className="w-3 h-3" strokeWidth={3.5} />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer con contador */}
          {filteredOptions.length > 0 && (
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider tabular-nums">
                {filteredOptions.length} {filteredOptions.length === 1 ? 'opción' : 'opciones'}
              </p>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold uppercase tracking-wide"
                >
                  Limpiar
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Keyframes inline (para no depender de plugins de tailwind) */}
      <style>{`
        @keyframes selectDropIn {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default SelectField;