// frontend/src/components/common/ClienteSearch.jsx
import { useState } from 'react';
import { getClientes } from '../../services/clienteService';
import { getMascotas } from '../../services/mascotaService';
import SelectField from './SelectField';
import toast from 'react-hot-toast';
import {
  Search as SearchIcon, CreditCard, Users as UsersIcon,
  PawPrint, Check, X, AlertTriangle, Info,
  CheckCircle2, Loader2, UserCheck,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   ClienteSearch
   Props:
   - onMascotaSelected: (mascota) => void
   ═══════════════════════════════════════════════════ */
const ClienteSearch = ({ onMascotaSelected }) => {
  const [cedula, setCedula] = useState('');
  const [cliente, setCliente] = useState(null);
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const handleCedulaChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setCedula(raw);
    // Limpiar resultados si el usuario cambia la cédula
    if (cliente || notFound || mascotaSeleccionada) {
      setCliente(null);
      setMascotas([]);
      setMascotaSeleccionada(null);
      setNotFound(false);
    }
  };

  const buscarCliente = async () => {
    if (!cedula.trim()) {
      toast.error('Ingrese una cédula');
      return;
    }
    setLoading(true);
    setNotFound(false);
    setCliente(null);
    setMascotas([]);
    setMascotaSeleccionada(null);

    try {
      const res = await getClientes({ search: cedula });
      const clientes = res.data;

      if (!clientes || clientes.length === 0) {
        setNotFound(true);
        return;
      }

      const clienteEncontrado = clientes[0];
      setCliente(clienteEncontrado);

      // Cargar mascotas del cliente
      const mascotasRes = await getMascotas({ clienteId: clienteEncontrado.id });
      setMascotas(mascotasRes.data || []);
    } catch (error) {
      console.error('Error al buscar cliente:', error);
      toast.error('Error al buscar cliente');
      setCliente(null);
      setMascotas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarMascota = (value) => {
    const mascota = mascotas.find((m) => m.id === Number(value));
    setMascotaSeleccionada(mascota || null);
    if (mascota) onMascotaSelected(mascota);
  };

  const limpiarTodo = () => {
    setCedula('');
    setCliente(null);
    setMascotas([]);
    setMascotaSeleccionada(null);
    setNotFound(false);
  };

  /* Opciones para el SelectField */
  const mascotaOptions = mascotas
    .filter((m) => m.activo !== false)
    .map((m) => ({
      value: m.id,
      label: m.nombre,
      description:
        [m.especie?.nombre, m.raza?.nombre].filter(Boolean).join(' · ') ||
        'Sin detalles',
      icon: PawPrint,
    }));

  const hayMascotas = mascotaOptions.length > 0;

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
      {/* ── Header ── */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
        <UsersIcon className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
        <h3 className="text-base font-semibold text-slate-800">
          Buscar cliente
        </h3>
        {(cliente || notFound) && (
          <button
            type="button"
            onClick={limpiarTodo}
            className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-lg
                       text-[11px] font-semibold text-slate-500
                       hover:text-red-600 hover:bg-red-50 transition"
          >
            <X className="w-3 h-3" strokeWidth={2.5} />
            Limpiar
          </button>
        )}
      </div>

      {/* ── Input cédula + botón buscar ── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <CreditCard
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            strokeWidth={2.2}
          />
          <input
            type="text"
            inputMode="numeric"
            value={cedula}
            onChange={handleCedulaChange}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), buscarCliente())}
            placeholder="Ingresa la cédula del cliente"
            className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white tabular-nums
                       hover:border-slate-400
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder:text-slate-400 transition"
          />
          {cedula && (
            <button
              type="button"
              onClick={limpiarTodo}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md
                         text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              aria-label="Limpiar"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={buscarCliente}
          disabled={loading || !cedula.trim()}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                     px-5 py-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white
                     rounded-lg text-sm font-semibold
                     hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800
                     transition disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-sm shadow-blue-600/20"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
              Buscando...
            </>
          ) : (
            <>
              <SearchIcon className="w-4 h-4" strokeWidth={2.5} />
              Buscar
            </>
          )}
        </button>
      </div>

      {/* ── Hint de ayuda ── */}
      {!cliente && !notFound && !loading && (
        <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
          <Info className="w-3 h-3 shrink-0" strokeWidth={2.5} />
          Ingresa la cédula y presiona Enter o Buscar
        </p>
      )}

      {/* ── No encontrado ── */}
      {notFound && (
        <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" strokeWidth={2.2} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-amber-900">
              Cliente no encontrado
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              No existe un cliente con la cédula{' '}
              <span className="font-mono font-semibold">{cedula}</span>. Verifica el
              número o créalo desde <span className="font-semibold">Clientes → Nuevo</span>.
            </p>
          </div>
        </div>
      )}

      {/* ── Cliente encontrado ── */}
      {cliente && (
        <div className="mt-4 space-y-4">
          {/* Card del cliente */}
          <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-white border border-emerald-200 overflow-hidden">
            <div className="flex items-center gap-3 p-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5 text-emerald-600" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {cliente.nombre}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[11px] text-emerald-700">
                  <span className="inline-flex items-center gap-1">
                    <CreditCard className="w-3 h-3 shrink-0" strokeWidth={2.5} />
                    <span className="font-mono font-semibold">{cliente.cedula}</span>
                  </span>
                  {cliente.telefono && (
                    <>
                      <span className="text-emerald-300">·</span>
                      <span className="tabular-nums">{cliente.telefono}</span>
                    </>
                  )}
                </div>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wide
                                border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" strokeWidth={3} />
                Encontrado
              </span>
            </div>
          </div>

          {/* Selector de mascota o aviso */}
          {mascotas.length === 0 ? (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" strokeWidth={2.2} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-amber-900">
                  Este cliente no tiene mascotas registradas
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Regístrala primero desde el perfil del cliente.
                </p>
              </div>
            </div>
          ) : hayMascotas ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <PawPrint className="w-3.5 h-3.5 text-blue-500" strokeWidth={2.2} />
                Selecciona una mascota <span className="text-red-500">*</span>
                <span className="ml-auto text-[11px] text-slate-400 font-normal">
                  {mascotaOptions.length}{' '}
                  {mascotaOptions.length === 1 ? 'mascota' : 'mascotas'}
                </span>
              </label>
              <SelectField
                value={mascotaSeleccionada?.id || ''}
                onChange={handleSeleccionarMascota}
                options={mascotaOptions}
                placeholder="Buscar mascota..."
                tone="blue"
                state={mascotaSeleccionada ? 'valid' : 'idle'}
              />
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" strokeWidth={2.2} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-amber-900">
                  Todas las mascotas están inactivas
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Activa una mascota desde el perfil del cliente para continuar.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClienteSearch;