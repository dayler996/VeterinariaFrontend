// frontend/src/pages/Logs/LogsPage.jsx
import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import { formatDateTime } from '../../utils/formatters';
import {
  ScrollText, Search as SearchIcon, Filter, X, Check,
  ChevronDown, Calendar, User as UserIcon, Users as UsersIcon,
  Activity, ShieldCheck, AlertTriangle, Eye,
  ClipboardList, Plus, Pencil, Trash2, LogIn, ShoppingCart,
  DollarSign, Ban, Boxes, FileText, Clock, Database,
  FileSearch, Bell, Building2, Stethoscope, Syringe,
  Microscope, Heart, CreditCard, Package, PawPrint,
  RefreshCw,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   CONFIG — Colores e iconos por acción
   ═══════════════════════════════════════════════════ */
const ACCION_CONFIG = {
  CREAR:         { tone: 'emerald', Icon: Plus,         label: 'Crear' },
  ACTUALIZAR:    { tone: 'blue',    Icon: Pencil,       label: 'Actualizar' },
  ELIMINAR:      { tone: 'red',     Icon: Trash2,       label: 'Eliminar' },
  LOGIN:         { tone: 'violet',  Icon: LogIn,        label: 'Login' },
  VENDER:        { tone: 'amber',   Icon: ShoppingCart, label: 'Vender' },
  PAGO:          { tone: 'emerald', Icon: DollarSign,   label: 'Pago' },
  ANULAR:        { tone: 'red',     Icon: Ban,          label: 'Anular' },
  AJUSTAR_STOCK: { tone: 'orange',  Icon: Boxes,        label: 'Ajustar stock' },
};

const ACCION_TONE = {
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  blue:    { bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-200' },
  red:     { bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-200' },
  violet:  { bg: 'bg-violet-100',  text: 'text-violet-700',  border: 'border-violet-200' },
  amber:   { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200' },
  orange:  { bg: 'bg-orange-100',  text: 'text-orange-700',  border: 'border-orange-200' },
  slate:   { bg: 'bg-slate-100',   text: 'text-slate-700',   border: 'border-slate-200' },
};

/* ═══════════════════════════════════════════════════
   CONFIG — Iconos por entidad
   ═══════════════════════════════════════════════════ */
const ENTIDAD_ICON = {
  Usuario:          UserIcon,
  Cliente:          UsersIcon,
  Mascota:          PawPrint,
  Producto:         Package,
  Factura:          FileText,
  Pago:             CreditCard,
  Cita:             Calendar,
  Consulta:         Stethoscope,
  Vacuna:           Syringe,
  Vacunacion:       Syringe,
  Estudio:          Microscope,
  Operacion:        Activity,
  ServicioEstetica: Heart,
  TipoOperacion:    Activity,
  TipoEstudio:      Microscope,
};

/* ═══════════════════════════════════════════════════
   FILTROS AVANZADOS — Rediseño premium responsive
   ═══════════════════════════════════════════════════ */
const FiltrosPanel = ({
  filters,
  handleFilterChange,
  handleSearch,
  handleLimpiarFiltros,
  setFilters,
  entidadesDisponibles,
  accionesDisponibles,
  usuarios,
  trabajadores,
}) => {
  const [abierto, setAbierto] = useState(true);

  /* ── Filtros activos como chips ── */
  const filtrosActivos = useMemo(() => {
    const list = [];
    if (filters.entidad) {
      list.push({ key: 'entidad', label: 'Entidad', value: filters.entidad, icon: Database });
    }
    if (filters.accion) {
      list.push({ key: 'accion', label: 'Acción', value: filters.accion, icon: Activity });
    }
    if (filters.usuarioId) {
      const u = usuarios.find((x) => String(x.id) === String(filters.usuarioId));
      list.push({
        key: 'usuarioId',
        label: 'Usuario',
        value: u?.email || u?.nombreUsuario || `#${filters.usuarioId}`,
        icon: UserIcon,
      });
    }
    if (filters.trabajadorId) {
      const t = trabajadores.find((x) => String(x.id) === String(filters.trabajadorId));
      list.push({
        key: 'trabajadorId',
        label: 'Trabajador',
        value: t?.nombre || `#${filters.trabajadorId}`,
        icon: Building2,
      });
    }
    if (filters.desde) {
      list.push({
        key: 'desde',
        label: 'Desde',
        value: new Date(filters.desde).toLocaleString('es-ES', {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
        }),
        icon: Calendar,
      });
    }
    if (filters.hasta) {
      list.push({
        key: 'hasta',
        label: 'Hasta',
        value: new Date(filters.hasta).toLocaleString('es-ES', {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
        }),
        icon: Clock,
      });
    }
    if (filters.search) {
      list.push({ key: 'search', label: 'Búsqueda', value: filters.search, icon: SearchIcon });
    }
    return list;
  }, [filters, usuarios, trabajadores]);

  const hayFiltrosActivos = filtrosActivos.length > 0;

  /* ── Presets rápidos de fecha ── */
  const aplicarPreset = (preset) => {
    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    let desde = '';
    let hasta = '';

    const pad = (n) => String(n).padStart(2, '0');
    const fmt = (d) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    switch (preset) {
      case 'hoy': {
        desde = fmt(hoy);
        hasta = fmt(ahora);
        break;
      }
      case 'ayer': {
        const ayer = new Date(hoy);
        ayer.setDate(ayer.getDate() - 1);
        const finAyer = new Date(hoy);
        finAyer.setSeconds(-1);
        desde = fmt(ayer);
        hasta = fmt(finAyer);
        break;
      }
      case 'semana': {
        const hace7 = new Date(hoy);
        hace7.setDate(hace7.getDate() - 7);
        desde = fmt(hace7);
        hasta = fmt(ahora);
        break;
      }
      case 'mes': {
        const hace30 = new Date(hoy);
        hace30.setDate(hace30.getDate() - 30);
        desde = fmt(hace30);
        hasta = fmt(ahora);
        break;
      }
      default:
        return;
    }

    setFilters((prev) => ({ ...prev, desde, hasta, page: 1 }));
  };

  /* ── Quitar un filtro individual ── */
  const quitarFiltro = (key) => {
    setFilters((prev) => ({ ...prev, [key]: '', page: 1 }));
  };

  /* ── Detectar preset activo ── */
  const presetActivo = (() => {
    if (!filters.desde && !filters.hasta) return null;
    const hoy = new Date();
    const desdeDate = filters.desde ? new Date(filters.desde) : null;
    if (!desdeDate) return null;
    const diff = Math.round((hoy - desdeDate) / (1000 * 60 * 60 * 24));
    if (diff <= 0.5) return 'hoy';
    if (diff <= 1.5) return 'ayer';
    if (diff <= 7.5) return 'semana';
    if (diff <= 31) return 'mes';
    return null;
  })();

  /* ── Presets config ── */
  const presets = [
    { key: 'hoy',    label: 'Hoy',         Icon: Clock },
    { key: 'ayer',   label: 'Ayer',        Icon: Calendar },
    { key: 'semana', label: 'Últ. semana', Icon: Calendar },
    { key: 'mes',    label: 'Últ. mes',    Icon: Calendar },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 mb-4 overflow-hidden">
      {/* ═══ Cabecera ═══ */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 border-b border-slate-100">
        <button
          type="button"
          onClick={() => setAbierto((o) => !o)}
          className="flex items-center gap-2.5 min-w-0 flex-1 text-left group"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800
                          flex items-center justify-center shrink-0 shadow-sm">
            <Filter className="w-4 h-4 text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-slate-800 truncate">
                Filtros de búsqueda
              </h3>
              {hayFiltrosActivos && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                  bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wide
                                  border border-blue-200">
                  <Check className="w-3 h-3" strokeWidth={3} />
                  {filtrosActivos.length} activo{filtrosActivos.length === 1 ? '' : 's'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {abierto ? 'Toca para ocultar' : 'Toca para expandir'}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={handleLimpiarFiltros}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                         text-[11px] font-semibold text-red-600 hover:bg-red-50
                         border border-transparent hover:border-red-200 transition"
            >
              <X className="w-3 h-3" strokeWidth={2.5} />
              Limpiar
            </button>
          )}
          <button
            type="button"
            onClick={() => setAbierto((o) => !o)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Toggle"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${abierto ? 'rotate-180' : ''}`}
              strokeWidth={2.5}
            />
          </button>
        </div>
      </div>

      {/* ═══ Chips de filtros activos ═══ */}
      {hayFiltrosActivos && (
        <div className="px-3 sm:px-4 py-2.5 bg-blue-50/40 border-b border-blue-100/60">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider shrink-0 mr-1">
              Aplicados:
            </span>
            {filtrosActivos.map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => quitarFiltro(f.key)}
                  className="group inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full
                             bg-white border border-blue-200 hover:border-red-300 hover:bg-red-50
                             text-[11px] font-medium text-slate-700 hover:text-red-700
                             transition shadow-sm"
                >
                  <Icon className="w-3 h-3 text-blue-600 group-hover:text-red-500 shrink-0"
                        strokeWidth={2.2} />
                  <span className="text-slate-500 group-hover:text-red-600">{f.label}:</span>
                  <span className="font-semibold truncate max-w-[140px]">{f.value}</span>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center
                                   text-slate-400 group-hover:text-red-600 group-hover:bg-red-100
                                   transition shrink-0">
                    <X className="w-2.5 h-2.5" strokeWidth={3} />
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleLimpiarFiltros}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full
                         text-[10px] font-bold text-red-600 hover:bg-red-100
                         uppercase tracking-wide transition ml-1"
            >
              <X className="w-3 h-3" strokeWidth={3} />
              Limpiar todo
            </button>
          </div>
        </div>
      )}

      {/* ═══ Panel ═══ */}
      {abierto && (
        <form onSubmit={handleSearch} className="p-3 sm:p-4 space-y-4">

          {/* ── Sección 1: Filtros principales ── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
              <Database className="w-3.5 h-3.5 text-blue-600 shrink-0" strokeWidth={2.5} />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Filtros principales
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Entidad */}
              <FilterField icon={Database} label="Entidad" tone="slate">
                <select
                  name="entidad"
                  value={filters.entidad}
                  onChange={handleFilterChange}
                  className="w-full border border-slate-300 rounded-lg pl-9 pr-8 py-2.5 text-sm bg-white
                             appearance-none cursor-pointer
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             hover:border-slate-400 transition"
                >
                  <option value="">Todas las entidades</option>
                  {entidadesDisponibles.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </FilterField>

              {/* Acción */}
              <FilterField icon={Activity} label="Acción" tone="emerald">
                <select
                  name="accion"
                  value={filters.accion}
                  onChange={handleFilterChange}
                  className="w-full border border-slate-300 rounded-lg pl-9 pr-8 py-2.5 text-sm bg-white
                             appearance-none cursor-pointer
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             hover:border-slate-400 transition"
                >
                  <option value="">Todas las acciones</option>
                  {accionesDisponibles.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </FilterField>

              {/* Usuario */}
              <FilterField icon={UserIcon} label="Usuario" tone="blue">
                <select
                  name="usuarioId"
                  value={filters.usuarioId}
                  onChange={handleFilterChange}
                  className="w-full border border-slate-300 rounded-lg pl-9 pr-8 py-2.5 text-sm bg-white
                             appearance-none cursor-pointer
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             hover:border-slate-400 transition"
                >
                  <option value="">Todos los usuarios</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.email || u.nombreUsuario}
                    </option>
                  ))}
                </select>
              </FilterField>

              {/* Trabajador */}
              <FilterField icon={Building2} label="Trabajador" tone="violet">
                <select
                  name="trabajadorId"
                  value={filters.trabajadorId}
                  onChange={handleFilterChange}
                  className="w-full border border-slate-300 rounded-lg pl-9 pr-8 py-2.5 text-sm bg-white
                             appearance-none cursor-pointer
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             hover:border-slate-400 transition"
                >
                  <option value="">Todos los trabajadores</option>
                  {trabajadores.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </FilterField>
            </div>
          </section>

          {/* ── Divider ── */}
          <div className="border-t border-slate-100" />

          {/* ── Sección 2: Rango de fechas + presets ── */}
          <section>
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-600 rounded-full"></span>
                <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" strokeWidth={2.5} />
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Rango de fechas
                </h4>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1 flex-wrap">
                {presets.map((p) => {
                  const Icon = p.Icon;
                  const activo = presetActivo === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => aplicarPreset(p.key)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                                 text-[11px] font-semibold transition border
                        ${activo
                          ? 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
                    >
                      <Icon className="w-3 h-3" strokeWidth={2.5} />
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FilterField icon={Calendar} label="Desde" tone="indigo">
                <input
                  type="datetime-local"
                  name="desde"
                  value={filters.desde}
                  onChange={handleFilterChange}
                  className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                             hover:border-slate-400 transition"
                />
              </FilterField>

              <FilterField icon={Clock} label="Hasta" tone="indigo">
                <input
                  type="datetime-local"
                  name="hasta"
                  value={filters.hasta}
                  onChange={handleFilterChange}
                  className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                             hover:border-slate-400 transition"
                />
              </FilterField>
            </div>
          </section>

          {/* ── Divider ── */}
          <div className="border-t border-slate-100" />

          {/* ── Sección 3: Búsqueda ── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
              <SearchIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" strokeWidth={2.5} />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Búsqueda general
              </h4>
            </div>

            <div className="relative">
              <SearchIcon
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                strokeWidth={2.2}
              />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Buscar por ID de entidad, acción, entidad o usuario..."
                className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           hover:border-slate-400 transition"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => quitarFiltro('search')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md
                             text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </section>

          {/* ── Footer: botones ── */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2
                         bg-gradient-to-br from-blue-600 to-blue-700 text-white
                         px-4 py-2.5 rounded-lg text-sm font-semibold
                         hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900
                         transition shadow-sm shadow-blue-600/20
                         w-full sm:w-auto"
            >
              <Check className="w-4 h-4" strokeWidth={2.5} />
              Aplicar filtros
            </button>

            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={handleLimpiarFiltros}
                className="inline-flex items-center justify-center gap-2
                           bg-white text-red-600 border border-red-200
                           px-4 py-2.5 rounded-lg text-sm font-semibold
                           hover:bg-red-50 hover:border-red-300 active:bg-red-100
                           transition
                           w-full sm:w-auto"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
                Limpiar filtros
              </button>
            )}

            <div className="hidden sm:flex flex-1 items-center justify-end">
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 shrink-0" strokeWidth={2.5} />
                Los filtros se aplican al pulsar el botón
              </p>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   FilterField — Wrapper con icono flotante y label
   ═══════════════════════════════════════════════════ */
const FilterField = ({ icon: Icon, label, tone = 'slate', children }) => {
  const toneCls = {
    slate:   { bg: 'bg-slate-100',   text: 'text-slate-600' },
    blue:    { bg: 'bg-blue-100',    text: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
    violet:  { bg: 'bg-violet-100',  text: 'text-violet-600' },
    indigo:  { bg: 'bg-indigo-100',  text: 'text-indigo-600' },
    amber:   { bg: 'bg-amber-100',   text: 'text-amber-600' },
  }[tone];

  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative group">
        {/* Icono flotante */}
        <div className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md
                         flex items-center justify-center pointer-events-none z-10
                         ${toneCls.bg} ${toneCls.text}
                         transition group-focus-within:scale-110`}>
          <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
        </div>
        {children}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   Badge de acción
   ═══════════════════════════════════════════════════ */
const AccionBadge = ({ accion }) => {
  const config = ACCION_CONFIG[accion] || { tone: 'slate', Icon: Bell, label: accion };
  const toneCls = ACCION_TONE[config.tone];
  const Icon = config.Icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                      ${toneCls.bg} ${toneCls.text} ${toneCls.border} border
                      text-[11px] font-semibold whitespace-nowrap`}>
      <Icon className="w-3 h-3" strokeWidth={2.5} />
      {config.label}
    </span>
  );
};

/* ═══════════════════════════════════════════════════
   Badge de entidad
   ═══════════════════════════════════════════════════ */
const EntidadBadge = ({ entidad, entidadId }) => {
  const Icon = ENTIDAD_ICON[entidad] || Database;

  return (
    <div className="inline-flex items-center gap-1.5 min-w-0">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-slate-600" strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{entidad || '—'}</p>
        {entidadId && (
          <p className="text-[11px] text-slate-400 tabular-nums">#{entidadId}</p>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   PÁGINA PRINCIPAL
   ═══════════════════════════════════════════════════ */
const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    entidad: '',
    accion: '',
    usuarioId: '',
    trabajadorId: '',
    desde: '',
    hasta: '',
    search: '',
    page: 1,
    limit: 50,
  });
  const [meta, setMeta] = useState({ total: 0, totalPages: 0, page: 1, limit: 50 });
  const [accionesDisponibles, setAccionesDisponibles] = useState([]);
  const [entidadesDisponibles, setEntidadesDisponibles] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);

  /* Modal de detalle */
  const [modalDetalle, setModalDetalle] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);
  const [logSeleccionado, setLogSeleccionado] = useState(null);

  /* ── Cargar opciones ── */
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setAccionesDisponibles([
          'CREAR', 'ACTUALIZAR', 'ELIMINAR', 'LOGIN',
          'VENDER', 'PAGO', 'ANULAR', 'AJUSTAR_STOCK',
        ]);
        setEntidadesDisponibles([
          'Usuario', 'Cliente', 'Mascota', 'Producto', 'Factura', 'Pago',
          'Cita', 'Consulta', 'Vacuna', 'Vacunacion', 'Estudio', 'Operacion',
          'ServicioEstetica', 'TipoOperacion', 'TipoEstudio',
        ]);

        const [usersRes, trabajadoresRes] = await Promise.all([
          api.get('/usuarios?incluirInactivos=false'),
          api.get('/trabajadores?incluirInactivos=false'),
        ]);
        setUsuarios(usersRes.data);
        setTrabajadores(trabajadoresRes.data);
      } catch (error) {
        toast.error('Error cargando opciones de filtro');
      }
    };
    fetchOptions();
  }, []);

  /* ── Cargar logs ── */
  const cargarLogs = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach((key) => !params[key] && delete params[key]);
      const res = await api.get('/logs', { params });
      setLogs(res.data.data);
      setMeta(res.data.meta);
    } catch (error) {
      toast.error('Error al cargar logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit]);

  /* ── Handlers ── */
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    cargarLogs();
  };

  const handleLimpiarFiltros = () => {
    setFilters({
      entidad: '',
      accion: '',
      usuarioId: '',
      trabajadorId: '',
      desde: '',
      hasta: '',
      search: '',
      page: 1,
      limit: filters.limit,
    });
    setTimeout(() => cargarLogs(), 0);
  };

  const handleVerDetalle = (log) => {
    setDetalleSeleccionado(log.detalle);
    setLogSeleccionado(log);
    setModalDetalle(true);
  };

  /* ── Contadores para stats ── */
  const stats = useMemo(() => {
    const porAccion = {};
    logs.forEach((l) => {
      porAccion[l.accion] = (porAccion[l.accion] || 0) + 1;
    });
    return {
      total: meta.total,
      creaciones: porAccion.CREAR || 0,
      actualizaciones: porAccion.ACTUALIZAR || 0,
      eliminaciones: porAccion.ELIMINAR || 0,
      accionesCriticas: (porAccion.ELIMINAR || 0) + (porAccion.ANULAR || 0),
    };
  }, [logs, meta.total]);

  const hayFiltrosActivos =
    filters.entidad || filters.accion || filters.usuarioId ||
    filters.trabajadorId || filters.desde || filters.hasta || filters.search;

  /* ═══ Columnas de la tabla (desktop) ═══ */
  const columns = [
    {
      header: 'Fecha / Hora',
      accessorKey: 'timestamp',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-slate-500" strokeWidth={2.2} />
          </div>
          <span className="text-sm text-slate-700 tabular-nums whitespace-nowrap">
            {formatDateTime(getValue())}
          </span>
        </div>
      ),
    },
    {
      header: 'Usuario',
      accessorKey: 'usuario',
      cell: ({ row }) => {
        const usuario = row.original.usuario;
        const trabajador = row.original.trabajador;
        const nombre = usuario?.email || usuario?.nombreUsuario || trabajador?.nombre || 'N/A';
        const subtexto = usuario?.email && trabajador?.nombre ? trabajador.nombre : null;
        return (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <UserIcon className="w-4 h-4 text-blue-600" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{nombre}</p>
              {subtexto && (
                <p className="text-[11px] text-slate-400 truncate">{subtexto}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Acción',
      accessorKey: 'accion',
      cell: ({ getValue }) => <AccionBadge accion={getValue()} />,
    },
    {
      header: 'Entidad',
      accessorKey: 'entidad',
      cell: ({ row }) => (
        <EntidadBadge
          entidad={row.original.entidad}
          entidadId={row.original.entidadId}
        />
      ),
    },
    {
      header: 'Detalle',
      accessorKey: 'detalle',
      cell: ({ getValue, row }) => {
        const det = getValue();
        if (!det) return <span className="text-xs text-slate-400">—</span>;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleVerDetalle(row.original);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg
                       bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700
                       text-xs font-medium transition"
          >
            <Eye className="w-3.5 h-3.5" strokeWidth={2.2} />
            Ver detalle
          </button>
        );
      },
    },
  ];

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="p-3 sm:p-4">
      <PageHeader
        icon="📋"
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Auditoría' },
        ]}
        title="Registro de Actividades"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <ScrollText className="w-3.5 h-3.5" strokeWidth={2.2} />
            {stats.total} registro{stats.total === 1 ? '' : 's'} en total
            {hayFiltrosActivos && (
              <span className="text-blue-600 font-medium"> (filtrados)</span>
            )}
          </span>
        }
        actions={
          <button
            onClick={cargarLogs}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5
                       bg-white text-slate-700 border border-slate-200
                       px-3 py-2 rounded-lg text-sm font-medium
                       hover:bg-slate-50 hover:border-slate-300 transition
                       disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              strokeWidth={2.2}
            />
            Actualizar
          </button>
        }
      />

      {/* ═══ Banner info ═══ */}
      <div className="mb-4 p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-700/25 shrink-0">
          <ShieldCheck className="w-6 h-6 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            Registro de auditoría
          </p>
          <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
            Trazabilidad de todas las acciones del sistema
          </p>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <Bell className="w-3 h-3 shrink-0" strokeWidth={2.2} />
            Cada cambio en el sistema queda registrado con usuario, fecha y detalle
          </p>
        </div>
      </div>

      {/* ═══ Stats cards ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
        <StatCard
          icon={ClipboardList}
          label="Total registros"
          value={stats.total}
          tone="slate"
        />
        <StatCard
          icon={Plus}
          label="Creaciones"
          value={stats.creaciones}
          tone="emerald"
        />
        <StatCard
          icon={Pencil}
          label="Actualizaciones"
          value={stats.actualizaciones}
          tone="blue"
        />
        <StatCard
          icon={AlertTriangle}
          label="Críticas (elim./anul.)"
          value={stats.accionesCriticas}
          tone="red"
        />
      </div>

      {/* ═══ Filtros ═══ */}
      <FiltrosPanel
        filters={filters}
        setFilters={setFilters}
        handleFilterChange={handleFilterChange}
        handleSearch={handleSearch}
        handleLimpiarFiltros={handleLimpiarFiltros}
        entidadesDisponibles={entidadesDisponibles}
        accionesDisponibles={accionesDisponibles}
        usuarios={usuarios}
        trabajadores={trabajadores}
      />

      {/* ═══ Contenido ═══ */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-blue-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando registros...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 sm:p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <FileSearch className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
          </div>
          <p className="text-slate-500 text-sm font-medium px-4">
            {hayFiltrosActivos
              ? 'No hay registros que coincidan con los filtros aplicados'
              : 'No hay registros de actividades'}
          </p>
          {hayFiltrosActivos && (
            <button
              onClick={handleLimpiarFiltros}
              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ═══ DESKTOP: Tabla ═══ */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
            <DataTable
              columns={columns}
              data={logs}
              showGlobalFilter={false}
              hidePagination
            />
          </div>

          {/* ═══ MÓVIL: Cards ═══ */}
          <div className="lg:hidden space-y-2.5">
            {logs.map((log) => {
              const usuario = log.usuario;
              const trabajador = log.trabajador;
              const nombre = usuario?.email || usuario?.nombreUsuario || trabajador?.nombre || 'N/A';
              const IconEntidad = ENTIDAD_ICON[log.entidad] || Database;

              return (
                <div
                  key={log.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden"
                >
                  {/* Cabecera: fecha + acción */}
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-slate-50/50 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" strokeWidth={2.2} />
                      <span className="text-[11px] text-slate-600 tabular-nums truncate">
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>
                    <AccionBadge accion={log.accion} />
                  </div>

                  {/* Cuerpo */}
                  <div className="p-3 space-y-2.5">
                    {/* Entidad */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <IconEntidad className="w-4 h-4 text-slate-600" strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {log.entidad || 'Sin entidad'}
                        </p>
                        {log.entidadId && (
                          <p className="text-[11px] text-slate-400 tabular-nums">
                            ID: #{log.entidadId}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Usuario */}
                    <div className="flex items-center gap-2 min-w-0 pt-2 border-t border-slate-100">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <UserIcon className="w-3.5 h-3.5 text-blue-600" strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                          Usuario
                        </p>
                        <p className="text-xs text-slate-700 truncate">{nombre}</p>
                        {trabajador?.nombre && usuario?.email && (
                          <p className="text-[10px] text-slate-400 truncate">
                            {trabajador.nombre}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botón ver detalle */}
                  {log.detalle && (
                    <button
                      onClick={() => handleVerDetalle(log)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium
                                 text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition
                                 border-t border-slate-100"
                    >
                      <Eye className="w-3.5 h-3.5" strokeWidth={2.3} />
                      Ver detalle
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* ═══ Paginación ═══ */}
          {meta.totalPages > 1 && (
            <div className="mt-4 bg-white rounded-xl shadow-sm border border-slate-200/60 p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-slate-500 tabular-nums order-2 sm:order-1">
                  Página <span className="font-semibold text-slate-700">{meta.page}</span> de{' '}
                  <span className="font-semibold text-slate-700">{meta.totalPages}</span>
                  {' · '}
                  <span className="font-semibold text-slate-700">{meta.total}</span> registro
                  {meta.total === 1 ? '' : 's'}
                </p>
                <div className="order-1 sm:order-2 w-full sm:w-auto">
                  <Pagination
                    currentPage={meta.page}
                    totalPages={meta.totalPages}
                    onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ Modal de detalle ═══ */}
      <Modal
        isOpen={modalDetalle}
        onClose={() => setModalDetalle(false)}
        title="Detalle de la actividad"
        size="lg"
      >
        <div className="space-y-4">
          {/* Info rápida del log */}
          {logSeleccionado && (
            <div className="rounded-lg bg-slate-50 border border-slate-100 overflow-hidden">
              <div className="divide-y divide-slate-100">
                <ModalInfoRow
                  icon={Clock}
                  label="Fecha y hora"
                  value={formatDateTime(logSeleccionado.timestamp)}
                />
                <ModalInfoRow
                  icon={Activity}
                  label="Acción"
                  value={<AccionBadge accion={logSeleccionado.accion} />}
                />
                <ModalInfoRow
                  icon={Database}
                  label="Entidad"
                  value={
                    <EntidadBadge
                      entidad={logSeleccionado.entidad}
                      entidadId={logSeleccionado.entidadId}
                    />
                  }
                />
                <ModalInfoRow
                  icon={UserIcon}
                  label="Usuario"
                  value={
                    logSeleccionado.usuario?.email ||
                    logSeleccionado.usuario?.nombreUsuario ||
                    logSeleccionado.trabajador?.nombre ||
                    'N/A'
                  }
                />
                {logSeleccionado.trabajador?.nombre && (
                  <ModalInfoRow
                    icon={Building2}
                    label="Trabajador"
                    value={logSeleccionado.trabajador.nombre}
                  />
                )}
              </div>
            </div>
          )}

          {/* Detalle JSON */}
          {detalleSeleccionado && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                <FileText className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
                <h3 className="text-sm font-semibold text-slate-800">
                  Detalle del cambio
                </h3>
              </div>
              <div className="rounded-lg bg-slate-900 border border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">
                    JSON
                  </span>
                </div>
                <pre className="p-3 sm:p-4 text-xs text-emerald-300 font-mono whitespace-pre-wrap
                                overflow-auto max-h-80 leading-relaxed">
                  {JSON.stringify(detalleSeleccionado, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
          <button
            onClick={() => setModalDetalle(false)}
            className="inline-flex items-center justify-center gap-2
                       px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium
                       hover:bg-slate-200 active:bg-slate-300 transition"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
            Cerrar
          </button>
        </div>
      </Modal>
    </div>
  );
};

/* ═══════════════ Stat card ═══════════════ */
const StatCard = ({ icon: Icon, label, value, tone = 'slate' }) => {
  const toneCls = {
    slate:   { bg: 'bg-slate-50',   border: 'border-slate-200/60',   iconBg: 'bg-slate-100',   iconText: 'text-slate-600',   value: 'text-slate-800' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200/60', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', value: 'text-emerald-700' },
    blue:    { bg: 'bg-blue-50',    border: 'border-blue-200/60',    iconBg: 'bg-blue-100',    iconText: 'text-blue-600',    value: 'text-blue-700' },
    red:     { bg: 'bg-red-50',     border: 'border-red-200/60',     iconBg: 'bg-red-100',     iconText: 'text-red-600',     value: 'text-red-700' },
  }[tone];

  return (
    <div className={`${toneCls.bg} rounded-xl border ${toneCls.border} p-3 sm:p-4`}>
      <div className="flex items-start gap-2 sm:gap-3">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${toneCls.iconBg}`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${toneCls.iconText}`} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate leading-tight">
            {label}
          </p>
          <p className={`text-lg sm:text-2xl font-bold ${toneCls.value} mt-0.5 tabular-nums truncate`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════ Fila de info en el modal ═══════════════ */
const ModalInfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 px-3 py-2.5">
    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-slate-600" strokeWidth={2.2} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </p>
      <div className="text-sm font-medium text-slate-800 mt-0.5 break-words">
        {value || '—'}
      </div>
    </div>
  </div>
);

export default LogsPage;